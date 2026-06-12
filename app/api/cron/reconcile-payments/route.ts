import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";
import { reconcilePendingPayments } from "@/lib/payments/reconcile";
import { reconcilePendingPayouts } from "@/lib/payouts/reconcile";
import { createServiceClient } from "@/lib/supabase/service";

// Reconciliation cron (scheduled in vercel.json). Vercel attaches
// `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set; we require it
// in production so the endpoint can't be triggered by anyone. In local dev with
// no secret set, it's open for manual runs.
export async function GET(request: NextRequest) {
  const secret = serverEnv.cronSecret;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // Never run unauthenticated in production.
    return NextResponse.json({ error: "cron secret not configured" }, { status: 503 });
  }

  // Recover both legs of the money flow: missed collection callbacks and
  // missed B2C payout callbacks. Both sweeps are idempotent.
  const [payments, payouts] = await Promise.all([
    reconcilePendingPayments(),
    reconcilePendingPayouts(),
  ]);
  // Housekeeping: drop stale rate-limit windows.
  await createServiceClient().rpc("prune_rate_limits");
  return NextResponse.json(
    { ok: true, payments, payouts },
    { headers: { "cache-control": "no-store" } },
  );
}
