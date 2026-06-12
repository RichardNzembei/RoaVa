/*
  Centralised, validated environment access. Fail fast at startup rather than
  with a cryptic runtime error mid-payment. Secrets (service role, signing keys,
  provider secrets) are read ONLY in server modules — never re-exported to the
  client. Anything not prefixed NEXT_PUBLIC_ stays server-side.
*/

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Safe to expose to the browser.
export const publicEnv = {
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  // The Supabase Vercel integration injects the newer `PUBLISHABLE_KEY` name;
  // classic projects / local dev use `ANON_KEY`. Accept either — both are the
  // public client key and supabase-js treats them interchangeably.
  supabaseAnonKey: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
  // Canonical site origin for SEO (sitemap, robots, canonical, JSON-LD).
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  ),
};

// Server-only secrets. Importing this from a Client Component will throw at
// build time because the values are undefined in the browser bundle; the
// `server-only` guard in the consuming modules is the real enforcement.
export const serverEnv = {
  /**
   * Bypasses RLS — payment/webhook writes only. NEVER send to the client.
   * The Supabase Vercel integration injects this as `SUPABASE_SECRET_KEY`
   * (newer naming); classic projects / local dev use `SUPABASE_SERVICE_ROLE_KEY`.
   */
  supabaseServiceRoleKey: () =>
    required(
      "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY,
    ),
  /** HMAC secret for signing single-use ticket QR payloads (Section 4.4). */
  ticketSigningSecret: () =>
    required("TICKET_SIGNING_SECRET", process.env.TICKET_SIGNING_SECRET),

  /**
   * IntaSend (M-Pesa STK + payouts). All optional — when the keys are absent
   * the app falls back to the local mock provider so the full pending→callback
   * flow is testable without live credentials.
   */
  intasend: {
    publishableKey: process.env.INTASEND_PUBLISHABLE_KEY ?? "",
    secretKey: process.env.INTASEND_SECRET_KEY ?? "",
    webhookChallenge: process.env.INTASEND_WEBHOOK_CHALLENGE ?? "",
    testMode: (process.env.INTASEND_TEST_MODE ?? "true") !== "false",
  },

  /** Force a specific payment provider: "mock" | "intasend". */
  paymentsProvider: process.env.PAYMENTS_PROVIDER ?? "",

  /** Shared secret protecting the reconciliation cron route. */
  cronSecret: process.env.CRON_SECRET ?? "",

  /**
   * Africa's Talking — transactional SMS only (CLAUDE.md §2). Optional: with no
   * creds the app logs messages instead of sending (dev).
   */
  africasTalking: {
    username: process.env.AT_USERNAME ?? "",
    apiKey: process.env.AT_API_KEY ?? "",
    senderId: process.env.AT_SENDER_ID ?? "",
  },
};

// Manual M-Pesa fallback shown when STK fails repeatedly (never dead-end, §6.6).
export const manualPayment = {
  paybill: process.env.NEXT_PUBLIC_FALLBACK_PAYBILL ?? "",
  enabled: Boolean(process.env.NEXT_PUBLIC_FALLBACK_PAYBILL),
};
