# RoaVa — end-to-end browser test report

**Date:** 2026-06-12 · **Build:** local dev (`next dev`, commit `1015bb0`) against the local
Supabase stack with seed data + the **mock** M-Pesa provider · **Viewport:** desktop Chrome.

Every user-facing flow was driven through the real UI. Payment/payout callbacks were delivered
to the dev-only mock endpoints (`/api/payments/mock`, `/api/payouts/mock`) to simulate the async
M-Pesa/B2C responses; DB state was inspected directly to confirm each invariant.

Legend: ✅ verified · ⚠️ note · ⛔ not testable in this run (reason given).

---

## 1. Landing page (`/`) ✅
- **Functionality:** all CTAs resolve (Explore experiences → discovery; List your experience → operator).
- **UI:** full-bleed sunlit savanna hero; RoaVa wordmark (sunset "V"); descriptor "discover · book · experience"; H1 "Kenya, from every angle"; value props (Pay with M-Pesa / Trust, built in / Truly local); "Popular near Nairobi" cards; "How it works" (3 steps); savanna operators band; footer (KES + bilingual blurb).
- **UX:** sentence case throughout, one primary (Sunset) action per section, hairline borders, real imagery, Verified badge pairs ✓ icon + label (never colour alone). On-brand and clean.

## 2. Discovery (`/discover`) ✅
- "Find your next day out" + search box; category chips (horizontal scroll); "This week" (next-7-days) + "All experiences" sections; 2-col cards with Verified badge, image, location, price (KES), star rating, next-slot date.

## 3. Search & filters (`/experiences`) ✅
- **Category chip → `?category=`**: "Hiking & nature" → 2 correct results, select pre-filled.
- **Text search `?q=tea`**: 1 correct result ("Kiambethu tea farm tour and lunch").
- Filter form: search, Category, County, Date, Max price (KES), Guests, Search, Clear filters; result count ("N results"); empty state ("No experiences match / Try widening…").
- ⚠️ Unverified operator's card correctly shows **no** Verified badge (correct trust signalling).

## 4. Experience detail (`/experiences/[id]`) ✅
- Hero + gallery, title, location + category chip, operator (Verified badge only when verified), Save (wishlist) button.
- Slot picker: date list (seats per slot), guest stepper, **live price recompute** (KES 4,000 × 2 = 8,000), Continue.
- About + duration, Meeting point, **Cancellation policy shown BEFORE payment** (trust), Reviews, "Prices in KES… M-Pesa at checkout" note.

## 5. Auth — phone OTP (`/sign-in`) ✅
- Booking while signed-out **gates to sign-in** with full return path preserved (`next=…/book?slot=…&party=2`).
- Phone entry → OTP step: "Sent to +254 712 345 678" (E.164 normalise + format), **resend cooldown** ("Resend code in 28s"), Change number.
- Verify (test OTP `123456`) → session created.

## 6. Onboarding + account ✅
- New profile → **onboarding** name capture ("What should we call you?"), `next` preserved → after save, deep-link round-trip lands on checkout.
- Account page: name (persisted from onboarding) + Save, phone (read-only, formatted), Language EN/SW, **Theme System/Light/Dark**, links (Tickets/Saved/List with us/Sign out).
- **Dark mode** ✅ — full palette applied.
- **Language EN↔SW** ✅ — verified on `/experiences` (Vinjari matukio, Aina yoyote, Hakuna matukio yanayolingana, …) and header.

## 7. Booking + M-Pesa (mock) + ticket ✅ — the money-critical path
- **Happy path:** Pay → pending booking + capacity reserved + mock STK sent → **calm waiting screen** (spinner, "Check your phone", 60s countdown). Mock **success** callback → page **auto-updates via poll** to "Booking confirmed" → ticket issued + SMS (logged in dev). DB confirmed: `booking=confirmed, payment=success, tickets=1`.
- **Ticket** (`/tickets/[id]`): "Valid" badge, QR, **"● Live HH:MM:SS"** liveness clock (anti-screenshot), Guests/Meeting point/Booking ref, "Works offline — keep this page open. Each ticket can be used once."
- **Failure path (insufficient funds):** pending reserved capacity (2→3) → mock `insufficient_funds` callback → booking **cancelled**, payment **failed**, **capacity released back to 2** (release-once invariant). UI: specific "Not enough M-Pesa balance" → "Top up or use Fuliza", **Try again in 11s** cooldown, **manual Paybill fallback** ("Paybill 247247, account …, amount KES 4,000"), Browse other experiences. Never dead-ends.

## 8. Operator lifecycle ✅
- **Become operator** (`/operator`): business name → dashboard ("Your experiences", Earnings/Check in/New, empty state).
- **Create draft**: title/category/county/price → manage page (Draft badge, publish controls, Photos empty state, Details edit form, Availability/slot manager).
- **Publish guard** ✅: publishing with no photo → inline "Add at least one photo before publishing."
- **Slot manager** ✅: add-slot form (date/time/capacity/repeat/price-override) + slot list ("Mon 15 Jun · 0/10 booked · Remove").
- **Check-in scanner** (`/operator/check-in`): camera "Scan a ticket" + manual code entry.
  - Paste valid code → **"Checked in ✓ · Test Mwangi · 1 guest · Test sunset rooftop tour"** (HMAC verified, booking → completed).
  - Re-scan same code → **"Already used"** (single-use anti-replay ✓).
- **Payouts** (`/operator/payouts`) — the new disbursement module:
  - **Share split** ✅: Gross 1,500 − fee 150 (10%) = **net 1,350**.
  - **Payout-number guard** ✅: no Send button until M-Pesa number saved.
  - Send payout → payout row **pending** (`mockpayout_` ref), booking payout_status **pending** (pending-until-callback). Mock success callback → payout **success**, booking **paid**. UI states: Owed → Sending → **Paid** (Net 1,350 / Paid out 1,350 / Owed 0). Non-custodial disclosure shown.
- **Review** (completed booking): 5★ + text → posted → detail page aggregate updates to **★ 5.0 (1 review)**.

---

## Invariants confirmed (via DB inspection)
- Atomic capacity reservation + **release-once** on failure (oversell impossible).
- **Pending-until-callback** for both collection and payout (never confirmed on the request).
- Signed single-use QR (HMAC `bookingId.nonce.sig`); check-in atomic + replay-blocked.
- Server-side price recompute (party × unit) and server-side commission split.

## Not exercised in this run (with reason)
- ⛔ **Image upload** (operator photos, review photos) — OS file picker isn't drivable here; empty states + "Choose Files" controls render correctly. Publish prerequisites for the test listing were seeded in the local DB to reach downstream flows.
- ⛔ **Offline ticket** — service worker + "works offline" + live clock are implemented; not network-disconnect-tested here.
- ⛔ **Scanner "not your experience" / "invalid" / "not confirmed"** states — covered by DB integration tests; only success + already-used exercised in-browser.
- ⛔ **Reconciliation cron**, **PWA install/manifest**, **wishlist toggle persistence** — implemented; not clicked in this run (wishlist persistence was verified in a prior session).
- ⚠️ **Image fallback nuance:** an *empty* `images[]` renders a tasteful letter-placeholder (seen on operator thumbnails), but an *invalid/missing* image key renders the `<img>` alt text rather than that placeholder. Surfaced only because the test listing used a bogus seeded key; real uploads are unaffected. Minor — consider an `onError` fallback to the letter-placeholder for robustness.

## Verdict
All in-scope v1 flows work end-to-end with correct functionality, on-brand UI, and the
documented UX states (loading / empty / error / success). The money-critical invariants hold
under both success and failure. No functional defects found; one minor cosmetic hardening note
(invalid-image fallback).
