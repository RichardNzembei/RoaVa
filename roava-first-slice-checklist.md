# Roava — first slice build checklist (the booking spine)

The goal of this slice: **one consumer can find one experience, pick a date, pay with M-Pesa, and get a QR ticket; one operator can list that experience and check the guest in — reliably.** Nothing else. Build this end to end before any breadth (more experiences, discovery feed, search, reviews, the AI engine).

Use this with `CLAUDE.md` (rules), `roava-v1-build-plan.md` (context), and `roava-first-slice-schema.sql` (the database). Hand all four to Claude Code.

Tasks are ordered. Don't start a later block until the earlier one works end to end.

---

## M0 — Foundation

- [ ] Scaffold Next.js (App Router) + TypeScript + Tailwind.
- [ ] Wire the design tokens into the Tailwind config: colors (Sunset `#D85A30`, Sunset-dark `#A8482A`, Sunset-tint `#FAECE7`, Savanna `#0F6E56`, Ink `#241F1C`, Sand `#F7F3EE`, Success `#1D9E75`, Warning `#EF9F27`, Danger `#E24B4A`), the type scale, 8-pt spacing, radii. Set up dark mode.
- [ ] Create the Supabase project; run `roava-first-slice-schema.sql`.
- [ ] Add env vars: Supabase URL + anon key (client) and service-role key (server only). Add IntaSend and Africa's Talking keys as server-only.
- [ ] Add a PWA manifest + a basic service worker (offline shell; ticket caching comes in M4).
- [ ] Deploy to Vercel; confirm the deployed URL works (you'll need a stable HTTPS callback URL for payments).
- [ ] Set up Sentry (or equivalent) error capture.

## M1 — Auth (phone OTP)

- [ ] Configure Supabase phone auth via a supported SMS provider.
- [ ] Build the sign-in flow: enter phone → receive code → verify → session.
- [ ] On first sign-in, capture `full_name` (the `profiles` row is auto-created by the DB trigger; just update name).
- [ ] Confirm the session persists and protected pages redirect when logged out.
- [ ] Confirm a logged-in user can read only their own `profiles` row (RLS check).

## M2 — Minimal operator side

Just enough to put one real experience with slots into the system. Ugly is fine.

- [ ] "Become an operator": call `become_operator(business_name)`; user role flips to `operator` and an `operators` row is created.
- [ ] Operator: create an experience (title, description, category, area, meeting point, base price KES, max party size, cover image → Supabase Storage). Saves as `draft`.
- [ ] Operator: add availability slots to an experience (date/time + capacity). Allow a few one-off slots; repeating slots can wait.
- [ ] Operator: publish the experience (`status = 'published'`).
- [ ] Confirm RLS: an operator can only see/edit their own experiences and slots.

## M3 — Consumer: find & view

- [ ] A minimal list page of published experiences (no fancy discovery yet — a simple list is fine).
- [ ] Experience detail page (SSR): photos, description, meeting point, price, and a slot picker showing available slots with remaining capacity.
- [ ] Party-size selector; show the computed total in KES (display only — the server recomputes the real amount).
- [ ] "Book" CTA leads to checkout.

## M4 — Consumer: book & pay (the heart of the slice)

Implement the payment flow exactly. See the endpoint and flow specs below.

- [ ] Create pending booking via `create_pending_booking(slot_id, party_size)` — this atomically reserves capacity and returns a booking id. Handle the "slot unavailable" error in the UI.
- [ ] Initiate the IntaSend STK push from a server route; return immediately.
- [ ] Show the waiting screen: ~60s countdown + "Check your phone for the M-Pesa prompt."
- [ ] Implement the webhook route: verify the callback, store it in `payments` (idempotent via `provider_ref`), and on success call `confirm_booking`, on failure call `release_booking`.
- [ ] Implement a status-poll route the waiting screen calls until the booking is `confirmed`/`cancelled`.
- [ ] On success: show confirmation, generate the QR ticket, send an SMS confirmation (Africa's Talking).
- [ ] On each failure mode show a specific message + next step: timeout, insufficient funds, wrong PIN, cancelled, network. Offer retry (~30s cooldown).
- [ ] Provide a manual Paybill/Till fallback with the exact reference if STK keeps failing.
- [ ] Ticket wallet page: shows the QR; works offline (service-worker cached).
- [ ] Operator check-in page: scan QR → call `check_in_ticket(code)` → handle `ok` / `already_used` / `not_found` / `forbidden`.

---

## Endpoints (server routes)

| Route | Method | Purpose | Must do |
|---|---|---|---|
| `/api/bookings` | POST | Create pending booking | Call `create_pending_booking`; never trust a client-sent price |
| `/api/payments/initiate` | POST | Start IntaSend STK for a booking | Return immediately; persist a `payments` row as `pending` |
| `/api/payments/webhook` | POST | IntaSend callback | Verify signature/source; idempotent on `provider_ref`; on success → `confirm_booking` + generate ticket code + SMS; on failure → `release_booking`. **Treat the booking as pending until this fires.** |
| `/api/bookings/:id/status` | GET | Poll booking status | The waiting screen polls this |
| `/api/checkin` | POST | Operator scans a ticket | Call `check_in_ticket(code)` |

Service-role key only on the webhook and any route that writes payments/bookings/tickets. Everything else uses the user's session.

---

## Screens

| Screen | Notes |
|---|---|
| Sign in (phone OTP) | M1 |
| Operator: create/edit experience + slots | M2, can be plain |
| Experience list | M3, minimal |
| Experience detail + slot picker | M3, SSR |
| Checkout + waiting screen | M4, the critical one — countdown, polling, clear states |
| Payment result (success/each failure) | M4, specific copy per failure mode |
| Ticket wallet (QR, offline) | M4 |
| Operator check-in (scanner) | M4 |

Every screen needs its empty, loading, error, and success states. Skeletons over spinners.

---

## The payment flow, step by step (implement exactly)

1. User taps Book → POST `/api/bookings` → `create_pending_booking` reserves capacity atomically and returns `booking_id`. If it raises "slot unavailable", tell the user the slot just filled.
2. POST `/api/payments/initiate` → create a `pending` `payments` row, call IntaSend STK, return immediately. Move the UI to the waiting screen.
3. Waiting screen polls `/api/bookings/:id/status` and shows the ~60s countdown.
4. IntaSend calls `/api/payments/webhook`. Verify it. Look up by `provider_ref`; if already processed, no-op (idempotent). On success: mark payment `success`, call `confirm_booking(booking_id, ticket_code)`, send SMS. On failure: mark payment `failed` with reason, call `release_booking(booking_id)`.
5. The poll sees `confirmed` → show success + ticket. Or `cancelled` → show the specific failure + retry / manual fallback.
6. Never confirm a booking from the STK *request* response — only from the verified webhook. Never let a missed webhook orphan a paid booking: add a reconciliation job that re-checks `pending` payments older than a few minutes against IntaSend.

---

## Ticket QR

- v1: ticket `code` is an unguessable random token, stored once, encoded in the QR. Check-in looks it up and marks it `used` atomically (single-use). 
- Upgrade path: make the QR payload an HMAC-signed token (booking id + nonce, server secret) so it can be verified without a DB hit and is tamper-evident. Keep the single-use server check either way.

---

## Test checklist (do this before widening anything)

On a real low-end Android, with small real M-Pesa amounts, deliberately trigger and verify graceful handling of:

- [ ] Happy path: pay → confirmed → ticket → SMS received.
- [ ] Timeout (ignore the prompt for 60s).
- [ ] Insufficient funds.
- [ ] Wrong PIN.
- [ ] User cancels the prompt.
- [ ] Network drop mid-flow (kill connectivity after initiating).
- [ ] Duplicate/replayed webhook (must not double-confirm or double-count capacity).
- [ ] Two users booking the last seat at once (only one succeeds; capacity never exceeds).
- [ ] Missed webhook (reconciliation job recovers the booking state).
- [ ] Scan a ticket twice (second scan → `already_used`).
- [ ] Scan someone else's experience ticket as the wrong operator (→ `forbidden`).

## Definition of done for the slice

- [ ] No path leaves a booking paid-but-unconfirmed or confirmed-but-unpaid.
- [ ] Capacity can never exceed a slot's limit under concurrency.
- [ ] Every webhook is processed exactly once.
- [ ] Tickets are single-use; check-in enforces ownership.
- [ ] Works and feels fast on a real low-end Android; ticket viewable offline.
- [ ] RLS verified: users see only their own bookings/tickets; operators only their own data.

When all of the above hold, widen: more experiences, the discovery list/feed, search, reviews, fuller operator self-serve — then, much later, the aggregation/AI engine.
