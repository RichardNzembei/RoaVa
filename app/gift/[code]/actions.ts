"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { claimGift } from "@/lib/gifts";

export type ClaimState =
  | { status: "idle" }
  | { status: "error"; reason: string };

// Redeem a gift for the signed-in user. On success the booking becomes theirs,
// so we send them straight to the ticket.
export async function claimGiftAction(
  code: string,
  _prev: ClaimState,
  _formData: FormData,
): Promise<ClaimState> {
  await requireProfile(`/gift/${code}`);

  const { status, bookingId } = await claimGift(code);

  if ((status === "ok" || status === "already_yours") && bookingId) {
    redirect(`/tickets/${bookingId}`);
  }
  return { status: "error", reason: status };
}
