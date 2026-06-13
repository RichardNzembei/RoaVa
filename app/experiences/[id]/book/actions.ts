"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { startBooking } from "@/lib/booking";
import { createGift } from "@/lib/gifts";

export type CheckoutState =
  | { status: "idle" }
  | { status: "error"; message: string };

// Begins the booking + STK push, then sends the user to the waiting screen.
// Auth + name are required (the phone OTP IS the lightweight account).
export async function payWithMpesa(
  experienceId: string,
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const profile = await requireProfile(`/experiences/${experienceId}`);

  const slotId = String(formData.get("slot") ?? "");
  const partySize = Number(String(formData.get("party") ?? "1"));
  const phoneRaw = String(formData.get("phone") ?? "");

  const result = await startBooking({
    experienceId,
    slotId,
    partySize,
    phoneRaw,
    consumerProfileId: profile.id,
  });

  if (!result.ok) {
    return { status: "error", message: result.error };
  }

  // Gifting (diaspora slice): if the buyer is booking for someone else, record
  // the recipient + a claim code. Never block the paid booking on this.
  const isGift = String(formData.get("gift") ?? "") === "on";
  const recipient = String(formData.get("recipient") ?? "").trim();
  if (isGift && recipient) {
    try {
      await createGift({
        bookingId: result.bookingId,
        buyerProfileId: profile.id,
        recipientRaw: recipient,
        message: String(formData.get("gift_message") ?? ""),
      });
    } catch {
      // Booking stands as a normal booking for the buyer; gifting is best-effort.
    }
  }

  redirect(`/bookings/${result.bookingId}`);
}
