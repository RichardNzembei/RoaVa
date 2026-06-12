# Roava — deployment & pre-launch handoff

What the code already does, and the **owner-only steps** (accounts, keys, real-device
testing, legal) needed to go live. The app runs locally against the Supabase CLI
stack with mock payments/SMS; production needs real providers wired here.

---

## 1. Environment variables

Set these in Vercel (Project → Settings → Environment Variables). Local dev uses
`.env.local`; `.env.example` lists every key.

| Variable | Scope | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **server** | bypasses RLS — payment/booking/ticket writes only. Never expose. |
| `TICKET_SIGNING_SECRET` | **server** | HMAC secret for QR tickets. `openssl rand -hex 32` |
| `CRON_SECRET` | **server** | protects the reconciliation cron. `openssl rand -hex 16`. **Required in prod.** |
| `INTASEND_PUBLISHABLE_KEY` / `INTASEND_SECRET_KEY` | server | M-Pesa STK. Absent → app uses the mock provider. |
| `INTASEND_WEBHOOK_CHALLENGE` | server | shared secret verified on the webhook |
| `INTASEND_TEST_MODE` | server | `true` = sandbox, `false` = live |
| `AT_USERNAME` / `AT_API_KEY` / `AT_SENDER_ID` | server | Africa's Talking transactional SMS. Absent → SMS is logged, not sent. |
| `NEXT_PUBLIC_FALLBACK_PAYBILL` | public | manual M-Pesa Paybill shown after repeated STK failure |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | server / public | optional error monitoring (see §6) |

---

## 2. Supabase (cloud)

1. Create a Supabase project (region close to Kenya, e.g. `eu-central` or nearest).
2. Push the schema: `supabase link --project-ref <ref>` then `supabase db push`
   (applies everything in `supabase/migrations/`). Do **not** run the local seed in prod.
3. Auth → set up phone sign-in with a **Supabase-supported SMS provider**
   (Twilio / MessageBird / Vonage) for the OTP. Africa's Talking is transactional only.
4. Copy the project URL, anon key, and service-role key into Vercel env.
5. Regenerate types after schema changes: `pnpm db:types`.

## 3. Vercel

1. Import the repo; framework auto-detects Next.js.
2. Add all env vars from §1.
3. `vercel.json` already schedules the **reconciliation cron** at `/api/cron/reconcile-payments`
   every 5 minutes. **Vercel Cron at sub-daily frequency needs a Pro plan** — on Hobby it
   runs once/day, which is too slow for payment recovery. Budget for Pro, or move the cron
   to an external scheduler hitting the same route with the `CRON_SECRET` bearer.
4. Note the stable HTTPS URL — you need it for the IntaSend webhook.

## 4. IntaSend (M-Pesa)

1. Create an IntaSend account; complete KYC; get publishable + secret keys (sandbox first).
2. Set the keys + `INTASEND_TEST_MODE=true` in Vercel; the app switches from mock to the
   IntaSend provider automatically when keys are present.
3. Configure the IntaSend webhook to point at `https://<your-domain>/api/payments/intasend/webhook`
   and set `INTASEND_WEBHOOK_CHALLENGE` to the same value.
4. **Verify the IntaSend client** (`lib/payments/intasend.ts`) against current IntaSend API
   docs — endpoint paths and field names were written to spec and need confirming with a real
   sandbox account before trusting them.
5. Confirm the non-custodial settlement structure (collect → disburse operator share, retain
   commission) with IntaSend — this is also the legal question in §7.

## 5. Africa's Talking (SMS)

Set `AT_USERNAME` / `AT_API_KEY` (+ optional `AT_SENDER_ID`). Verify the messaging endpoint in
`lib/sms/index.ts` against AT docs. Without keys, confirmations log to the server instead of sending.

## 6. Error monitoring (Sentry)

Out of the box, uncaught route/server-action errors are captured via `instrumentation.ts`
(`onRequestError`) and deliberate swallows via `lib/observability.ts` — both log structured
errors. To forward to Sentry: `pnpm add @sentry/nextjs`, add `sentry.server.config.ts` +
`instrumentation-client.ts` with `Sentry.init({ dsn })`, set the DSN env, and replace the body
of `onRequestError` with `Sentry.captureRequestError`. The `reportError` helper is the single
forwarding point for swallowed errors.

## 7. Pre-launch checklist (do not skip)

**Legal (owner + Kenyan counsel):**
- [ ] Confirm the collect-and-disburse flow keeps Roava out of money-transmitter / CBK PSP
      territory (no funds held). This can reshape the corporate structure.
- [ ] Kenya Data Protection Act (2019): privacy policy, data minimisation, and whether ODPC
      registration as a data controller applies.
- [ ] Refund/cancellation policy + terms of service + operator agreement.

**Product / config:**
- [ ] Confirm the **10% platform commission** (`PLATFORM_COMMISSION_RATE` in `lib/payments/index.ts`).
- [x] App icons: SVG mark + raster + **maskable PNGs** (192/512) + apple-icon are generated
      (`pnpm icons` from `public/icon*.svg`). Review the mark; regenerate if the brand art changes.
- [ ] **Marketing imagery:** the landing (`/`) uses free Pexels Kenya/safari stock via
      `lib/marketing-media.ts`. Replace with the owner's **own licensed Kenyan photography**
      (the design spec wants real, owned imagery — never generic stock). To enable the hero
      **video**, set `HERO_VIDEO_SRC` to a licensed landscape clip (~720p, ≤3 MB, muted/looping);
      it auto-plays only on fast, non-Save-Data, motion-allowed connections, with the image
      carousel as the always-present fallback.
- [ ] Set `NEXT_PUBLIC_FALLBACK_PAYBILL` to your real Paybill/Till.

**Payment test matrix — on a real low-end Android, small live M-Pesa amounts:**
- [ ] Happy path: pay → confirmed → ticket → SMS received.
- [ ] Timeout (ignore the prompt ~60s).
- [ ] Insufficient funds.
- [ ] Wrong PIN.
- [ ] User cancels the prompt.
- [ ] Network drop mid-flow (kill connectivity after initiating).
- [ ] Duplicate/replayed webhook (no double-confirm, no double-count).
- [ ] Two users booking the last seat at once (only one succeeds).
- [ ] Missed webhook → the reconciliation cron recovers state within its window.
- [ ] Scan a ticket twice (second → already used).
- [ ] Scan a ticket as the wrong operator (→ not your experience).
- [ ] Confirm first-content < ~3s on metered 4G; ticket viewable offline.

> The mock provider + DB-level tests already prove the invariants (no oversell, idempotency,
> release-once, single-use, RLS isolation, reconciliation). This matrix re-verifies them
> against **live M-Pesa** before opening to the public.

---

## Remaining work

**Buildable (lower priority):**
- Full-app localization (beyond the entry funnel — header, landing, sign-in, onboarding are done)
- Product analytics (PostHog — needs an owner key)
- Review photos upload
- Text search

**Owner-gated** (deploy, IntaSend/AT/SMS keys, Sentry DSN, real-device test, legal, licensed imagery) — see the sections above.
