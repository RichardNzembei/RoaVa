import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { getPaymentProvider } from "@/lib/payments";

export type StartPayoutResult =
  | { ok: true; status: "pending" | "settled" }
  | { ok: false; error: string };

/*
  Disburse an operator's net share for one completed booking (the settle half of
  the non-custodial flow, CLAUDE.md §3). Mirrors startBooking on the collect side:
   1. initiate_payout (DB) — ownership + completed + payout-number checks, creates
      a PENDING payout row and flips booking.payout_status → pending. Atomic and
      idempotent (one payout per booking; a prior failure is reset for retry).
   2. provider.disburse — B2C. "Accepted" ≠ paid; we attach the provider_ref and
      confirm only on the payout callback / reconciliation (pending-until-callback).
  On a disbursement-initiation failure we mark the payout failed so the operator
  can retry — funds never moved, so there's nothing to reverse.
*/
export async function startPayout(
  bookingId: string,
  operatorId: string,
): Promise<StartPayoutResult> {
  const service = createServiceClient();
  const provider = getPaymentProvider();

  const { data: payoutId, error: initErr } = await service.rpc(
    "initiate_payout",
    { p_booking_id: bookingId, p_operator_id: operatorId },
  );
  if (initErr) {
    return { ok: false, error: "Couldn't start the payout. Please try again." };
  }
  if (!payoutId) {
    return {
      ok: false,
      error:
        "This payout isn't ready. Add your M-Pesa number and make sure the trip is completed.",
    };
  }

  const { data: po } = await service
    .from("payouts")
    .select("amount_kes, msisdn")
    .eq("id", payoutId as string)
    .single();
  if (!po) {
    return { ok: false, error: "Couldn't load the payout. Please try again." };
  }

  // A net-zero share (free experience) has nothing to disburse — settle directly.
  if (po.amount_kes <= 0) {
    await service
      .from("payouts")
      .update({ status: "success", provider_ref: `none_${bookingId}` })
      .eq("id", payoutId as string);
    await service
      .from("bookings")
      .update({ payout_status: "paid" })
      .eq("id", bookingId);
    return { ok: true, status: "settled" };
  }

  const result = await provider.disburse({
    amountKes: po.amount_kes,
    phone: po.msisdn,
    reference: bookingId,
    narrative: "RoaVa operator payout".slice(0, 60),
  });

  if (!result.ok) {
    await service
      .from("payouts")
      .update({ status: "failed", failure_reason: "initiation_failed" })
      .eq("id", payoutId as string);
    await service
      .from("bookings")
      .update({ payout_status: "failed" })
      .eq("id", bookingId);
    return {
      ok: false,
      error: "We couldn't reach the payout provider. Please try again.",
    };
  }

  await service
    .from("payouts")
    .update({ provider_ref: result.providerRef })
    .eq("id", payoutId as string);

  return { ok: true, status: "pending" };
}
