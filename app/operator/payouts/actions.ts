"use server";

import { revalidatePath } from "next/cache";
import { requireOperator } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { normalizeKenyanPhone } from "@/lib/phone";
import { startPayout } from "@/lib/payouts";

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
  Send (or retry) the operator's share for a completed booking via the provider's
  B2C rail (CLAUDE.md §3). Ownership, eligibility, and the share split are all
  enforced inside startPayout → initiate_payout (DB). The booking only flips to
  'paid' on the disbursement callback — here it becomes 'pending' (or 'failed' if
  the provider can't be reached). Used as a bound form action, so it returns void
  and the page reflects the new payout_status on revalidation.
*/
export async function sendPayout(bookingId: string) {
  const operator = await requireOperator();
  await startPayout(bookingId, operator.id);
  revalidatePath("/operator/payouts");
}
