import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { getPaymentProvider } from "@/lib/payments";
import { processCallback } from "@/lib/payments/webhook";

// A dropped webhook must never orphan a paid booking (CLAUDE.md §4.3 / slice §6).
// This sweeps still-pending payments: re-checks each against the provider and
// confirms/fails accordingly; bookings past the hard window with no resolution
// are expired so their capacity is released. Safe to run repeatedly — every
// underlying transition is idempotent.
const RECONCILE_AFTER_MS = 3 * 60 * 1000; // give the normal callback time first
const EXPIRE_AFTER_MS = 15 * 60 * 1000; // abandoned → release the seats

export type ReconcileSummary = {
  checked: number;
  confirmed: number;
  failed: number;
  expired: number;
  stillPending: number;
};

export async function reconcilePendingPayments(): Promise<ReconcileSummary> {
  const service = createServiceClient();
  const provider = getPaymentProvider();
  const now = Date.now();
  const cutoff = new Date(now - RECONCILE_AFTER_MS).toISOString();

  const { data: rows } = await service
    .from("payments")
    .select("provider_ref, booking_id, created_at, bookings!inner(status)")
    .eq("status", "pending")
    .not("provider_ref", "is", null)
    .lt("created_at", cutoff)
    .limit(200);

  const summary: ReconcileSummary = {
    checked: 0,
    confirmed: 0,
    failed: 0,
    expired: 0,
    stillPending: 0,
  };

  for (const row of rows ?? []) {
    const booking = row.bookings as unknown as { status: string };
    if (booking.status !== "pending") continue; // already resolved elsewhere
    summary.checked++;

    const providerRef = row.provider_ref as string;
    const state = await provider.getStatus(providerRef);

    if (state === "success") {
      await processCallback({ providerRef, state: "success" });
      summary.confirmed++;
    } else if (state === "failed") {
      await processCallback({
        providerRef,
        state: "failed",
        failureReason: "failed",
      });
      summary.failed++;
    } else {
      // Still pending per the provider — expire only once the hard window passes.
      const age = now - new Date(row.created_at as string).getTime();
      if (age > EXPIRE_AFTER_MS) {
        await service.rpc("expire_pending_booking", {
          p_booking_id: row.booking_id as string,
        });
        summary.expired++;
      } else {
        summary.stillPending++;
      }
    }
  }

  return summary;
}
