import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { getPaymentProvider } from "@/lib/payments";
import { processPayoutCallback } from "@/lib/payouts/webhook";

/*
  Payout reconciliation — a dropped B2C callback must never leave an operator
  unpaid-but-marked-pending forever. Sweeps still-pending payouts that already
  have a provider_ref and re-checks each against the provider. Safe to run
  repeatedly (every transition is idempotent).

  Unlike collections, we do NOT auto-expire a stuck payout: money may already be
  in flight provider-side, so we only act on a definite success/failure and
  leave genuinely-pending ones for the next sweep (surfaced to the operator as
  "sending").
*/
const RECONCILE_AFTER_MS = 3 * 60 * 1000; // give the normal callback time first

export type PayoutReconcileSummary = {
  checked: number;
  confirmed: number;
  failed: number;
  stillPending: number;
};

export async function reconcilePendingPayouts(): Promise<PayoutReconcileSummary> {
  const service = createServiceClient();
  const provider = getPaymentProvider();
  const cutoff = new Date(Date.now() - RECONCILE_AFTER_MS).toISOString();

  const { data: rows } = await service
    .from("payouts")
    .select("provider_ref")
    .eq("status", "pending")
    .not("provider_ref", "is", null)
    .lt("created_at", cutoff)
    .limit(200);

  const summary: PayoutReconcileSummary = {
    checked: 0,
    confirmed: 0,
    failed: 0,
    stillPending: 0,
  };

  for (const row of rows ?? []) {
    const providerRef = row.provider_ref as string;
    summary.checked++;
    const state = await provider.getPayoutStatus(providerRef);

    if (state === "success") {
      await processPayoutCallback({ providerRef, state: "success" });
      summary.confirmed++;
    } else if (state === "failed") {
      await processPayoutCallback({
        providerRef,
        state: "failed",
        failureReason: "failed",
      });
      summary.failed++;
    } else {
      summary.stillPending++;
    }
  }

  return summary;
}
