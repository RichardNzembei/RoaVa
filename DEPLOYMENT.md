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
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` *or* `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public | Supabase public client key. The Vercel↔Supabase integration injects the `PUBLISHABLE_KEY` name automatically; the code accepts either. |
| `SUPABASE_SERVICE_ROLE_KEY` *or* `SUPABASE_SECRET_KEY` | **server** | bypasses RLS — payment/booking/ticket writes only. Never expose. The integration injects `SUPABASE_SECRET_KEY`; the code accepts either. |
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

> **Fastest path (used for this project):** add the **Supabase** integration from the Vercel
> Marketplace (Project → Storage / Integrations → Supabase → Connect). It provisions a cloud
> Postgres and auto-injects `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
> `SUPABASE_SECRET_KEY`, and the `POSTGRES_*` connection strings into the project's env — no
> manual key copying. Leave the **custom prefix blank** so the names match the code. You still
> need to push the schema (below) and add the three app-only secrets in §1.

1. Create a Supabase project (region close to Kenya, e.g. `eu-central` or nearest) — or use
   the Vercel integration above, which creates one for you.
2. Push the schema: `supabase link --project-ref <ref>` then `supabase db push`
   (applies everything in `supabase/migrations/`). Do **not** run the local seed in prod.
3. Auth → set up phone sign-in with a **Supabase-supported SMS provider**
   (Twilio / MessageBird / Vonage) for the OTP. Africa's Talking is transactional only.
4. Copy the project URL, anon key, and service-role key into Vercel env.
5. Regenerate types after schema changes: `pnpm db:types`.

## 3. Vercel

1. Import the repo; framework auto-detects Next.js.
2. Add all env vars from §1.
3. `vercel.json` schedules the **reconciliation cron** at `/api/cron/reconcile-payments`.
   It's set to **daily** (`0 3 * * *`) because **Vercel Hobby only allows once-daily crons**.
   The waiting screen self-reconciles within ~1–2 min while a user's tab is open, so the cron
   is just the backstop for abandoned tabs. For tighter recovery, either: upgrade to **Pro**
   and change the schedule to `*/5 * * * *`, or hit `/api/cron/reconcile-payments` from an
   **external scheduler** (e.g. GitHub Actions, cron-job.org) every few minutes with the
   `Authorization: Bearer <CRON_SECRET>` header.
4. Note the stable HTTPS URL — you need it for the IntaSend webhook.

## 4. IntaSend (M-Pesa)

1. Create an IntaSend account; complete KYC; get publishable + secret keys (sandbox first).
2. Set the keys + `INTASEND_TEST_MODE=true` in Vercel; the app switches from mock to the
   IntaSend provider automatically when keys are present.
3. Configure the IntaSend webhooks:
   - collection callback → `https://<your-domain>/api/payments/intasend/webhook`
   - B2C / send-money (payout) callback → `https://<your-domain>/api/payouts/intasend/webhook`
   Set `INTASEND_WEBHOOK_CHALLENGE` to the shared secret (verified on both).
4. **Verify the IntaSend client** (`lib/payments/intasend.ts`) against current IntaSend API
   docs — both the STK collection AND the B2C `send-money` initiate/status/callback shapes were
   written to spec and need confirming with a real sandbox account before trusting them. The
   send-money approval step (`requires_approval`) in particular must be validated.
5. Confirm the non-custodial settlement structure (collect → disburse operator share, retain
   commission) with IntaSend — this is also the legal question in §7. The disbursement code path
   (initiate → pending → confirm on callback, idempotent, with reconciliation) is built and
   tested against the mock; only the live IntaSend wiring + real-money test remain.

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

**Done since the initial build:** text search (`/experiences?q=`), review photos upload,
EN/SW localization across the entry funnel **+ discovery feed + tickets list**, and the
**operator payout / disbursement module** (the settle half of §3): `payouts` ledger + RLS,
idempotent initiate/confirm/fail functions with the net-share split, provider `disburse()`
(mock + IntaSend B2C), payout webhook + reconciliation, and operator UI states. Verified
end-to-end against the mock; live IntaSend B2C wiring + real-money test are owner-gated (§4).

> **Note:** the payouts migration (`supabase/migrations/20260612160000_payouts.sql`) is applied
> locally and committed. It must also be pushed to the **cloud** DB (`supabase db push`, or paste
> it in the SQL editor) before the `/operator/payouts` page works in production.

**Buildable (lower priority):**
- ~~Finish localization~~ **Done** — EN/SW covers every screen *and* all server-action /
  validation error messages (actions read the locale cookie via `getT()`). The app is fully
  bilingual end-to-end.
- ~~Image fallback hardening~~ **Done** — `<ExperienceImage>` degrades to a letter-placeholder
  on load error (no broken frame/alt text).
- ~~Lint cleanup~~ **Done** — `pnpm lint` is at 0 errors.
- Product analytics (**PostHog**) — wiring is buildable; needs an owner key.

**Owner-gated** (deploy, IntaSend/AT/SMS keys, Sentry DSN, real-device test, legal, licensed imagery) — see the sections above.
