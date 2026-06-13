# Roava — go-live checklist

An **ordered, owner-action sequence** to take Roava from "code-complete on prod" to "open to
the public." Each step says who does it, what it unblocks, and how to know it's done. The *how*
for each lives in `DEPLOYMENT.md` (section refs in brackets) — this file is the running order.

> The code track is complete and the invariants are proven against the mock provider + DB-level
> tests. Everything below is **owner-gated**: accounts, keys, legal sign-off, and a real-money
> test pass. Nothing here needs new code.
>
> Legend: 🔴 hard blocker for launch · 🟡 strongly recommended before launch · ⚪ can follow launch.
> "Claude can help" = I can do the wiring/config once you supply the account or key (I never
> enter secrets, keys, or passwords myself — you paste those).

---

## Phase 0 — Legal (start now; it has the longest lead time) 🔴

These gate a *public* launch and can reshape company structure, so kick them off first — they
run in parallel with everything else. Owner + Kenyan counsel. [DEPLOYMENT.md §7]

- [ ] **PSP / money-transmitter opinion.** Confirm collect-and-disburse (non-custodial, no funds
      held) keeps Roava out of CBK PSP territory. Validate the exact settlement structure with
      IntaSend *and* counsel together.
- [x] **Data Protection Act (2019) — draft policy prepared.** `PRIVACY-POLICY.md` drafted
      2026-06-13 from the real data model + provider list (`[…]` placeholders for entity, contact,
      DPO, retention periods, transfer mechanism). **Still owner/counsel-gated before it counts as
      done:** legal review, lawful-basis confirmation, retention periods, international-transfer
      mechanism, cookie/consent approach, **ODPC registration decision**, and actual publication +
      data-minimisation review.
- [x] **Customer terms — drafts prepared.** `TERMS-OF-SERVICE.md` + `OPERATOR-AGREEMENT.md`
      drafted 2026-06-13 from the real model (non-custodial marketplace, `[10%]` commission, slot
      bookings, single-use QR, per-experience cancellation policy shown before payment). **Still
      owner/counsel-gated before done:** legal review, refund mechanics + who bears commission on
      refunds, liability caps, tax/insurance terms, governing-law venue.
      - [x] *Cancellation/refund terms surfaced before payment — verified & enforced 2026-06-13
        (commit `dcae0b6`).* Publish now requires a non-empty `cancellation_policy`; detail page and
        checkout always render the terms (platform-default fallback when unset), confirmed in the
        browser above the pay/continue action on both surfaces. The one policy-less seed listing
        ("Test gorge kayak adventure") was backfilled on **local + cloud** — 0 published listings now
        lack a policy. (Backfill is data-only; the durable guarantee is the publish guard + fallback,
        not the seed row.)
      - [x] *Publish guard browser-verified 2026-06-13.* Created a draft satisfying every other
        publish requirement (photo, meeting point, future slot) but no policy, signed in as the
        owning operator, clicked Publish → blocked with "Add a cancellation policy before
        publishing." and the listing stayed `draft` (DB-confirmed). Test draft cleaned up.

---

## Phase 1 — Production infrastructure 🔴

Get the app running on real cloud infra. [DEPLOYMENT.md §1, §2, §3]

- [x] Supabase cloud project provisioned (region near Kenya). *Done — project `cbzwrgvpimnvtivmeafg`.*
- [x] Schema pushed to cloud (`supabase db push`) — **including** the payouts and gifting
      migrations. *Verified 2026-06-13: all 11 migrations' objects (9 tables, `experience_reviews`
      view, both storage buckets, `profiles.email`, and every RPC incl. `claim_gift` / payout
      functions) confirmed present in cloud project `cbzwrgvpimnvtivmeafg` via authenticated REST
      probe. RLS policy text not byte-diffed (needs DB password); guard functions all present.*
- [x] Vercel project importing the repo, building green. *Done.*
- [ ] Core env vars set in Vercel: Supabase URL + keys (auto-injected by the integration),
      `TICKET_SIGNING_SECRET`, `CRON_SECRET`. — **You generate the two secrets** (`openssl rand`);
      Claude can confirm they're present and named correctly.
      *Verified 2026-06-13: all Supabase URL/keys + `NEXT_PUBLIC_SITE_URL` present (Prod+Preview).
      **`TICKET_SIGNING_SECRET` and `CRON_SECRET` are NOT set yet** — generate with*
      `openssl rand -hex 32` *and* `openssl rand -hex 16`*, add in Vercel, redeploy. Until then
      `verifyTicket()`/`signTicket()` throw on call (no fallback — see Phase 5 note) so prod
      check-in can't run, and the reconciliation cron is unprotected.*
- [ ] Note the stable HTTPS prod URL (needed for IntaSend webhooks and the Supabase Site URL).

---

## Phase 2 — Auth delivery (so real users can actually sign in) 🔴

Local uses test OTPs; prod needs real delivery on at least one method. [DEPLOYMENT.md §2, §2a]

- [ ] **Phone-OTP (primary):** add a Supabase-supported SMS provider (Twilio / MessageBird /
      Vonage) in the Supabase dashboard → Auth. *Africa's Talking is NOT an auth provider — it's
      transactional only.* — You create the provider account + paste credentials into Supabase.
- [ ] **Email-OTP (alternative):** transactional SMTP (Resend with a verified domain, or
      SendGrid/Brevo single-sender), "Confirm email" OFF, "Magic link or OTP" template carrying
      `{{ .Token }}`. *Config done in this build; needs the prod SMTP key + verified domain.*
- [ ] **Google OAuth (alternative):** OAuth client in Google Cloud, Client ID/Secret in Supabase,
      Site URL + `/auth/callback` redirect URLs set to the prod origin. — You create the OAuth
      client + pick the Google project; Claude can do the Supabase-side wiring.
- [ ] Smoke test: sign in on prod via each enabled method and reach the discovery feed.

---

## Phase 3 — Payments & SMS (the real blocker) 🔴

Until this is wired, prod can complete **no** payment (the dev mock is disabled in production).
[DEPLOYMENT.md §4, §5]

- [ ] IntaSend account created, KYC complete, **sandbox** keys obtained. — You; Claude can't KYC.
- [ ] Sandbox keys + `INTASEND_TEST_MODE=true` + `INTASEND_WEBHOOK_CHALLENGE` set in Vercel.
- [ ] Both webhooks configured in IntaSend:
      collection → `/api/payments/intasend/webhook`, payout → `/api/payouts/intasend/webhook`.
- [ ] **Verify `lib/payments/intasend.ts` against live IntaSend docs** — STK collection *and* the
      B2C `send-money` initiate/status/callback shapes were written to spec; the
      `requires_approval` send-money step especially must be validated against a real sandbox
      account. — Claude can do this verification once a sandbox account exists.
- [ ] `NEXT_PUBLIC_FALLBACK_PAYBILL` set to your real Paybill/Till (the never-dead-end fallback).
- [ ] Africa's Talking: `AT_USERNAME` / `AT_API_KEY` (+ `AT_SENDER_ID`) set; messaging endpoint in
      `lib/sms/index.ts` confirmed against AT docs. Without keys, SMS only logs server-side.
- [ ] Reconciliation cron live (`vercel.json`, daily on Hobby). For tighter recovery, upgrade to
      Pro (`*/5 * * * *`) or hit the endpoint from an external scheduler. [DEPLOYMENT.md §3]

---

## Phase 4 — Content & config 🟡

Make it real, not a demo. [DEPLOYMENT.md §7 "Product / config"]

- [ ] Confirm the **10% platform commission** (`PLATFORM_COMMISSION_RATE`).
- [ ] Replace seeded/placeholder data with **real published operators + recurring slots**.
- [ ] Swap Pexels stock for **owned, licensed Kenyan photography** (design spec mandates real,
      owned imagery). Optionally set `HERO_VIDEO_SRC` to a licensed clip.
- [ ] Review the generated app-icon mark; regenerate (`pnpm icons`) if brand art changed.
- [ ] Decide the analytics/consent stance, then optionally set `NEXT_PUBLIC_POSTHOG_KEY`
      (inert until set). [DEPLOYMENT.md §1, §11]
- [ ] Optional: Sentry — `pnpm add @sentry/nextjs` + DSN for error monitoring. ⚪ [DEPLOYMENT.md §6]

---

## Phase 5 — Real-money test matrix (the gate before opening) 🔴

On a **real low-end Android, metered 4G, small live M-Pesa amounts.** The mock already proves
these invariants; this re-verifies them against live rails. [DEPLOYMENT.md §7 test matrix]

- [ ] Happy path: pay → confirmed → ticket → SMS received.
- [ ] Timeout (ignore prompt ~60s) → specific message + retry, no orphaned booking.
- [ ] Insufficient funds → specific message.
- [ ] Wrong PIN → specific message.
- [ ] User cancels the prompt → specific message.
- [ ] Network drop mid-flow → no paid-but-unconfirmed booking.
- [ ] Duplicate/replayed webhook → no double-confirm, no double-count.
- [ ] Two users on the last seat → exactly one succeeds.
- [ ] Missed webhook → reconciliation recovers state within its window.
- [ ] Scan a ticket twice → second rejected (already used).
- [ ] Scan as the wrong operator → rejected (not your experience).

> ⚠️ **QR verification prerequisite (verified 2026-06-13).** Prod check-in **cannot work until
> `TICKET_SIGNING_SECRET` is set in Vercel** (Phase 1): `verifyTicket()` calls `required()` with no
> fallback, so it *throws* `Missing required environment variable` on any scan while the var is
> unset. Also: the ~6 tickets currently in the cloud DB are **seed data** signed at seed time — they
> will **not** verify against a freshly generated prod secret (`timingSafeEqual` mismatch) and are
> disposable. A genuine prod check-in test therefore needs a **freshly issued** ticket, which needs
> a confirmed booking (Phase 3 payments) — so run these two scan checks only *after* the secret is
> set and a real ticket exists.
- [ ] **Gifting:** book with gift toggle → pay → buyer gets claim link → recipient claims at
      `/gift/[code]` → ticket moves to recipient; second claim → already claimed. *(Proven on
      local incl. browser claim; this confirms it over live M-Pesa.)*
- [ ] Operator payout: complete a booking → disburse operator share → payout confirms via
      callback, commission retained, ledger correct.
- [ ] First content < ~3s on metered 4G; ticket viewable offline.

---

## Phase 6 — Go live

- [ ] Flip `INTASEND_TEST_MODE=false` (live keys) and redeploy.
- [ ] Final reconciliation sanity check: every successful payment maps to exactly one confirmed
      booking; no orphans.
- [ ] Onboard a small pilot cohort of real operators near Nairobi; run a few small real
      transactions end-to-end before opening to the public.
- [ ] Open.

---

## Critical path (what blocks what)

```
Phase 0 Legal ─────────────────────────────────────────────┐ (parallel, longest lead)
Phase 1 Infra ─→ Phase 2 Auth ─→ Phase 3 Payments ─→ Phase 5 Test matrix ─→ Phase 6 Go live
                                  Phase 4 Content ──────────┘ (parallel with 2–3)
```

The single biggest blocker is **Phase 3 (IntaSend)** — without live payment rails, no booking
can complete on prod, and the test matrix can't run. Start **Phase 0 (legal)** at the same time
because it has the longest external lead time and gates a *public* launch regardless of code.

*Not legal or financial advice — the Phase 0 items need a Kenyan lawyer's sign-off. Provider
details (IntaSend, Supabase auth, Africa's Talking) must be verified by the owner before relying
on them.*
