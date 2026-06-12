"use server";

import { revalidatePath } from "next/cache";
import { requireOperator } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizeKenyanPhone } from "@/lib/phone";

export type PayoutNumberState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; message: string };

// Operator sets/updates the M-Pesa number their payouts are sent to. Written
// under the operator's own session — RLS (owns_operator) scopes it to their
// operator_payouts row. Without this, payouts can't be disbursed.
export async function savePayoutNumber(
  _prev: PayoutNumberState,
  formData: FormData,
): Promise<PayoutNumberState> {
  const operator = await requireOperator();
  const phone = normalizeKenyanPhone(String(formData.get("payout_msisdn") ?? ""));
  if (!phone) {
    return {
      status: "error",
      message: "Enter a valid M-Pesa number, e.g. 0712 345 678.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("operator_payouts")
    .upsert({ operator_id: operator.id, payout_msisdn: phone });

  if (error) {
    return { status: "error", message: "We couldn't save that. Please try again." };
  }

  revalidatePath("/operator/payouts");
  revalidatePath("/operator");
  return { status: "saved" };
}

/*
  Record a payout for a completed booking. In production this is where the
  operator's share is disbursed via IntaSend B2C (M-Pesa) on the non-custodial
  rail — funds move provider→operator, we only record the result. Here we mark
  payout_status so the ledger reflects settlement. Ownership is enforced: the
  booking must belong to one of this operator's experiences.
*/
export async function recordPayout(bookingId: string) {
  const operator = await requireOperator();
  const service = createServiceClient();

  const { data: booking } = await service
    .from("bookings")
    .select("id, status, experiences!inner ( operator_id )")
    .eq("id", bookingId)
    .maybeSingle();

  const exp = booking?.experiences as unknown as { operator_id: string } | undefined;
  if (!booking || exp?.operator_id !== operator.id) return;
  if (booking.status !== "completed") return;

  // TODO(prod): initiate IntaSend B2C payout to operator_payouts.payout_msisdn,
  // then set 'paid' on the disbursement callback. Mocked as immediate here.
  await service
    .from("bookings")
    .update({ payout_status: "paid" })
    .eq("id", bookingId);

  revalidatePath("/operator/payouts");
}
