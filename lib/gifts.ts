import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { normalizeKenyanPhone } from "@/lib/phone";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Record a booking as a gift for a recipient (phone or email). Written with the
// service role (clients can't mutate gifts); the booking already exists. If the
// recipient is unparseable we skip gifting rather than fail the paid booking.
export async function createGift(opts: {
  bookingId: string;
  buyerProfileId: string;
  recipientRaw: string;
  message?: string;
}): Promise<boolean> {
  const raw = opts.recipientRaw.trim();
  const isEmail = EMAIL_RE.test(raw);
  const recipientPhone = isEmail ? null : normalizeKenyanPhone(raw);
  const recipientEmail = isEmail ? raw.toLowerCase() : null;
  if (!recipientPhone && !recipientEmail) return false;

  const svc = createServiceClient();
  const { error } = await svc.from("gifts").insert({
    booking_id: opts.bookingId,
    buyer_profile_id: opts.buyerProfileId,
    recipient_phone: recipientPhone,
    recipient_email: recipientEmail,
    message: opts.message?.trim() || null,
  });
  return !error;
}

// The gift attached to a booking (for showing the buyer the shareable claim
// link on their confirmation screen). Service role: the buyer owns the booking.
export async function getGiftForBooking(bookingId: string) {
  const svc = createServiceClient();
  const { data } = await svc
    .from("gifts")
    .select("redemption_code, claimed_at, recipient_phone, recipient_email")
    .eq("booking_id", bookingId)
    .maybeSingle();
  return data;
}

// Look up a gift by its code, with enough booking context to render the claim
// page. Service role so any holder of the code can see what they're claiming.
export async function getGiftByCode(code: string) {
  const svc = createServiceClient();
  const { data } = await svc
    .from("gifts")
    .select(
      `id, booking_id, message, claimed_at,
       bookings ( status,
         experiences ( title ),
         availability_slots ( start_at ) )`,
    )
    .ilike("redemption_code", code.trim())
    .maybeSingle();
  return data;
}

// Redeem a gift as the signed-in user. Runs the RPC under the user's session so
// auth.uid() is the claimer; the SECURITY DEFINER function reassigns the booking
// to them. Returns the booking id on success so the caller can route to the ticket.
export async function claimGift(
  code: string,
): Promise<{ status: string; bookingId?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_gift", {
    p_code: code.trim(),
  });
  const status = error ? "invalid" : ((data as string) ?? "invalid");
  if (status === "ok" || status === "already_yours") {
    const gift = await getGiftByCode(code);
    return { status, bookingId: gift?.booking_id };
  }
  return { status };
}
