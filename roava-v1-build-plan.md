# Roava v1 — build plan

A concrete, code-from-it plan for the first version, based on the decisions made: a discovery + booking PWA for **day-trips and experiences near Nairobi**, with **operator self-serve listing**, built by a capable solo developer using **Claude Code**, on **Next.js + Supabase**, with **M-Pesa via an aggregator (IntaSend)** on a **pass-through (non-custodial) money model**, passwordless auth (phone-OTP, email-OTP, and Google), PWA-first.

*This is a product/engineering plan, not legal or financial advice. Two compliance items (payments structure and data protection) need a Kenyan lawyer's eye before launch — flagged in the pre-launch checklist.*

---

## 1. What v1 is — and isn't

**v1 is:** a PWA where operators self-list experiences with recurring availability, consumers discover and book a dated slot, pay with M-Pesa, and receive a QR booking they can show at the meeting point; operators get paid and can check guests in.

**v1 is deliberately NOT:** native apps, WhatsApp automation, OTA/channel sync, dynamic pricing, the corporate/diaspora layer, a recommendation ML engine, or offline gate check-in. Those are v2+. Resist building them — scope creep is the main risk now.

**The wedge note:** because these are experiences (not single-date events), the core object is an experience with many `availability_slots`, each with its own date/time and capacity. Build for slots from day one.

---

## 2. Architecture

**Stack**
- PWA: Next.js (App Router) + TypeScript + Tailwind. Service worker for installability and offline ticket viewing. SSR/ISR on discovery pages for fast first loads on low-end Android and for SEO.
- Backend: Next.js route handlers (API routes) for v1.
- Data/auth/storage: Supabase — Postgres, Auth, Storage (operator images), and Row-Level Security (RLS). Use Prisma or Drizzle for typed queries, or Supabase client directly.
- Payments: IntaSend (M-Pesa STK collections + payouts + cards). Verify current fees/disbursement support/KYC before committing; Flutterwave or Pesapal are fallbacks.
- SMS: Africa's Talking for transactional confirmations.
- Hosting: Vercel (app) + Supabase (data).

**The money model (non-negotiable structure).** Funds flow through IntaSend's licensed rails, not your own ledger. Collect the payment, then disburse the operator's share via the provider, taking your commission as a defined fee/split — so you are not operating as a money transmitter holding customer funds. Confirm the exact settlement/split structure with IntaSend and a lawyer to stay clear of CBK PSP obligations (see §7).

**Auth methods (shipped).** v1 offers three passwordless sign-in methods, all via Supabase Auth: **phone-OTP** (primary), **email-OTP**, and **Google OAuth**. No passwords. A few practical notes from the build:
- Phone-OTP needs a *Supabase-supported* SMS provider (Twilio/MessageBird/Vonage) — Africa's Talking is **not** a native Supabase auth provider, so it's used for transactional SMS only (confirmations), not the auth OTP.
- Email-OTP is a 6-digit code (to match the phone UX), not a magic link — so the verify screen is identical across phone/email. This requires the email template to surface `{{ .Token }}` and "Confirm email" to be off (the default template sends a link, and a link dead-ends on the app's `/auth/callback` exchange if used as the code path). It needs a transactional SMTP provider (Resend with a verified domain, or SendGrid/Brevo single-sender) for real delivery; Gmail SMTP works for testing only.
- Google OAuth uses an OAuth client (created in Google Cloud) wired into Supabase's Google provider, with the app's `/auth/callback` doing the PKCE code exchange. Google users have no phone; their name is pre-filled from the provider so they skip onboarding.
- Identity model: `profiles.phone` and `profiles.email` are both nullable; the on-signup trigger captures whichever identifiers (and name) the chosen method provides.

---

## 3. Data model

Core entities (Postgres, with RLS). Fields are indicative, not exhaustive.

| Table | Key fields | Notes |
|---|---|---|
| `profiles` | id (= auth user), phone (nullable), email (nullable), name, role (consumer/operator/admin), created_at | Extends Supabase `auth.users`. Phone/email nullable since a user may arrive via any auth method |
| `operators` | id, owner_profile_id, business_name, bio, verified (bool), payout_msisdn, created_at | One per operator owner; `verified` drives the trust badge |
| `experiences` | id, operator_id, title, description, category, county, area, lat, lng, meeting_point, images[], base_price_kes, duration_minutes, max_party_size, cancellation_policy, status (draft/published), created_at | The listing |
| `availability_slots` | id, experience_id, start_at, capacity, booked_count, price_override (nullable), status | The bookable unit — many per experience |
| `bookings` | id, experience_id, slot_id, consumer_profile_id, party_size, amount_kes, commission_kes, status (pending/confirmed/cancelled/completed), payout_status, created_at | Created in `pending`, moves to `confirmed` only on payment callback |
| `payments` | id, booking_id, provider, provider_ref, amount_kes, status (pending/success/failed), failure_reason, raw_callback (jsonb), created_at | One per payment attempt; store raw callback for audit/reconciliation |
| `tickets` | id, booking_id, qr_payload (signed), status (valid/used), checked_in_at, checked_in_by | Generated on confirmed booking |
| `reviews` | id, experience_id, booking_id, consumer_profile_id, rating, body, photos[], created_at | Only from completed bookings |
| `wishlist` | profile_id, experience_id | Optional in v1 |

**RLS is essential** (this is a marketplace, so default-deny and write explicit policies): operators can read/write only their own `operators`/`experiences`/`availability_slots`; consumers can read published experiences and read/write only their own `bookings`/`tickets`/`reviews`; payment writes happen server-side with the service role, never from the client.

---

## 4. The critical flows, spec'd

**Auth (passwordless — phone, email, or Google).** Phone/email → 6-digit OTP → verify → session; or one-tap Google OAuth → `/auth/callback` exchange → session. Capture name on first sign-in (Google pre-fills it). Role defaults to consumer; the self-serve "List with RoaVa" flow creates an `operators` row and flips the role server-side.

**Operator: create a listing.** Create experience (title, description, category, location + meeting point, photos, price, party-size cap, cancellation policy) → add availability slots (single or repeating, each with capacity) → publish. Image upload to Supabase Storage with client-side compression; enforce consistent aspect ratios; ship a placeholder for missing images.

**Consumer: discover → book → pay.**
1. Discovery feed (near Nairobi): sections for "this weekend," "near you," "hidden gems," by category/area. SSR for speed.
2. Search/filter: category, area, date, price, party size.
3. Experience detail: photos, what's included, meeting point, reviews, cancellation terms, slot picker.
4. Select slot + party size → review price in KES → checkout.
5. Create `booking` in `pending` and **atomically reserve capacity** (see §5 race condition).
6. Initiate IntaSend STK push → return immediately → show a calm waiting screen with the ~60s countdown and "Check your phone for the M-Pesa prompt."
7. Treat as pending until the IntaSend webhook/poll confirms. On success → `booking.confirmed`, generate ticket, show confirmation + send SMS. On failure → specific message per mode (timeout/insufficient funds/wrong PIN/cancelled/network) with retry (~30s cooldown) and a manual-Paybill fallback. Never dead-end; never orphan a paid booking.

**Ticket + check-in.** Confirmed booking generates a signed QR (HMAC of booking id + nonce, server secret). Consumer's ticket wallet renders the QR and works offline (service-worker cached). Operator opens a check-in view, scans, server verifies the signature and marks the ticket `used` (rejecting replays/double-scans). v1 check-in is online; offline check-in is a fast-follow.

**Payout.** After completion (or per your policy), disburse the operator's share via IntaSend, recording `payout_status`. Commission retained as the defined fee.

---

## 5. The hard parts to get exactly right

- **Capacity race condition.** Two users grabbing the last seat simultaneously must not both succeed. Reserve capacity in a single atomic DB transaction (e.g. conditional `UPDATE ... SET booked_count = booked_count + n WHERE booked_count + n <= capacity`), and release the hold if payment fails or times out.
- **Webhook idempotency.** IntaSend may retry callbacks; process each `provider_ref` once. The STK "request accepted" response only means the prompt was sent — confirm on callback. Add a reconciliation/poll fallback in case a callback is missed.
- **QR security.** Signed, single-use payloads; verify server-side and mark used atomically to block screenshot resale and double-entry. Don't put the signing secret on the client.
- **Offline.** Ticket *viewing* offline in v1 (cache the QR + booking details). Honest offline states elsewhere; skeleton loaders over hanging spinners.
- **Performance budget.** Test on a real low-end Android: first content < ~3s on 4G, lean bundle, compressed/lazy images, minimal fonts. This is a feature, not a nicety.
- **Secrets & RLS.** Service-role key only server-side; correct RLS on every table; never trust client-supplied amounts — recompute price server-side from the slot.

---

## 6. Build milestones (order to build with Claude Code)

Build **vertical slices** — one full flow working end to end before adding breadth.

- **M0 — Setup.** Next.js + TS + Tailwind; wire the design tokens (Sunset/Ink/Sand palette + type scale from the design spec) into the Tailwind config; Supabase project; Vercel deploy; PWA manifest + service worker skeleton.
- **M1 — Auth + profiles.** Passwordless sign-in (phone-OTP + email-OTP + Google OAuth), profiles, roles, self-serve "become an operator." *(Phone-OTP was the v1 baseline; email + Google were added as alternative sign-in methods.)*
- **M2 — Operator listings.** Create/edit experiences + availability slots + image upload; RLS policies.
- **M3 — Discovery + detail.** Feed, search/filter, experience detail with slot picker; seed real-ish data; SSR.
- **M4 — Booking + payments.** Atomic capacity reservation, IntaSend STK initiation, waiting screen, webhook (idempotent) + poll fallback, pending→confirmed, full failure handling + manual fallback.
- **M5 — Tickets + check-in.** Signed QR generation, offline-viewable ticket wallet, operator scan + mark-used.
- **M6 — Notifications + reviews + polish.** Africa's Talking SMS confirmations, reviews from completed bookings, every empty/loading/error state, low-end-Android performance pass, operator payout flow.
- **Pilot.** Onboard a handful of real operators near Nairobi, run small real transactions, test every STK failure path deliberately, then open.

---

## 7. Pre-launch checklist (don't skip)

- **Payments structure (legal).** Confirm with IntaSend and a Kenyan lawyer that your collect-and-disburse flow keeps you out of money-transmitter/PSP territory. This is the one that can reshape your corporate structure.
- **Data protection (legal).** Kenya's Data Protection Act (2019) governs handling personal data (phone numbers, names, location). Registration with the Office of the Data Protection Commissioner as a data controller may apply — check with a lawyer; write a basic privacy policy and minimize data collected.
- **Payment failure testing.** Deliberately trigger timeout, insufficient funds, wrong PIN, cancel, and network failure in sandbox and with small live amounts. Confirm no orphaned/paid-but-unconfirmed bookings.
- **Refund/cancellation policy** defined and shown before payment.
- **Terms of service** and operator agreement.
- **Reconciliation** sanity check: every successful payment maps to exactly one confirmed booking.

---

## 8. Deferred to v2+

Native apps; WhatsApp confirmations; offline gate check-in; OTA/channel-manager sync; dynamic pricing; the corporate/diaspora layer; a real recommendation engine (v1 ranking can be simple — recency, proximity, popularity); loyalty/wishlist depth; multi-city expansion.

**Revisit trigger — corporate/diaspora layer.** This is demand, not supply: corporates booking group days out, diaspora gifting/booking experiences for family back home. It's high-margin (less price-sensitive, concentrated — one corporate = many seats) and it's a sales/BD effort, not new core architecture, so chasing it early would pull engineering away from the thing that actually unlocks it. The trigger to revisit is **liquidity, not a date**: enough published experiences with consistent real availability and reliable fulfillment that there's something genuinely worth selling to a corporate buyer. Good news — v1 does not paint you into a corner: `party_size` + per-slot capacity already support group bookings, and non-custodial payments mean bulk/invoice (corporate) and international card (diaspora) can bolt on later as new demand entry points without re-architecting bookings or money flow. Nothing to pre-build; just don't remove those.

---

## 9. Driving Claude Code well for this

- Start by giving Claude Code a short project brief (this document, trimmed to a `CLAUDE.md`) plus the design spec, so it has the tokens, data model, and constraints in context.
- Set up the Postgres schema and RLS policies early; everything depends on them.
- Build one vertical slice at a time (auth → listing → discovery → pay → ticket), testing each end to end before moving on.
- Be explicit with Claude Code about the non-obvious requirements: webhook idempotency, atomic capacity reservation, pending-until-callback, signed single-use QR, and never trusting client-supplied prices. These are where generated code most often cuts corners.
- Keep changes small and test the payment failure paths after every change to that flow.

*Figures and provider details current as of mid-2026; verify IntaSend pricing/KYC, Supabase auth-provider support, and the two compliance items before building on them.*
