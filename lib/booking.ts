import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { getPaymentProvider, commissionKes } from "@/lib/payments";
import { normalizeKenyanPhone } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n";

export type StartBookingInput = {
  experienceId: string;
  slotId: string;
  partySize: number;
  phoneRaw: string;
  consumerProfileId: string;
};

export type StartBookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: string };

/*
  The money-critical path (CLAUDE.md §4, §6). In order:
   1. Validate the slot/experience from authoritative server data.
   2. RECOMPUTE the price server-side — never trust a client amount (§3).
   3. ATOMICALLY reserve capacity (reserve_slot) — no oversell (§4.1).
   4. Create the booking PENDING + a pending payment (service role).
   5. Initiate the STK push; on failure, RELEASE the hold and cancel.
  The booking is only ever confirmed later by the payment callback (§4.2).
*/
export async function startBooking(
  input: StartBookingInput,
): Promise<StartBookingResult> {
  const t = await getT();
  const phone = normalizeKenyanPhone(input.phoneRaw);
  if (!phone) {
    return { ok: false, error: t("err_msisdn_invalid") };
  }
  const partySize = Math.trunc(input.partySize);
  if (!Number.isInteger(partySize) || partySize < 1) {
    return { ok: false, error: t("err_book_guests") };
  }

  // Throttle booking initiation per consumer (prevents STK-spam / capacity churn).
  const limit = await rateLimit(`book:${input.consumerProfileId}`, 8, 600);
  if (!limit.allowed) {
    return { ok: false, error: t("err_book_ratelimit") };
  }

  const service = createServiceClient();

  // Authoritative slot + experience (never trust client-sent price/capacity).
  const { data: slot } = await service
    .from("availability_slots")
    .select("id, experience_id, start_at, capacity, booked_count, price_override, status")
    .eq("id", input.slotId)
    .maybeSingle();
  if (!slot || slot.experience_id !== input.experienceId) {
    return { ok: false, error: t("err_book_slot_notfound") };
  }
  if (slot.status !== "open" || new Date(slot.start_at).getTime() <= Date.now()) {
    return { ok: false, error: t("err_book_slot_unavail") };
  }

  const { data: exp } = await service
    .from("experiences")
    .select("title, base_price_kes, max_party_size, status")
    .eq("id", input.experienceId)
    .maybeSingle();
  if (!exp || exp.status !== "published") {
    return { ok: false, error: t("err_book_exp_unavail") };
  }
  if (partySize > exp.max_party_size) {
    return {
      ok: false,
      error: t("err_book_maxparty").replace("{n}", String(exp.max_party_size)),
    };
  }

  // Server-side price.
  const unitPrice = slot.price_override ?? exp.base_price_kes;
  const amountKes = unitPrice * partySize;
  const commission = commissionKes(amountKes);

  const provider = getPaymentProvider();

  // Atomic reservation — two buyers can't both take the last seat.
  const { data: reserved, error: reserveErr } = await service.rpc(
    "reserve_slot",
    { p_slot_id: input.slotId, p_qty: partySize },
  );
  if (reserveErr) {
    return { ok: false, error: t("err_book_generic") };
  }
  if (reserved !== true) {
    return { ok: false, error: t("err_book_taken") };
  }

  // Create the pending booking. From here, any early return must release.
  const { data: booking, error: bookingErr } = await service
    .from("bookings")
    .insert({
      experience_id: input.experienceId,
      slot_id: input.slotId,
      consumer_profile_id: input.consumerProfileId,
      party_size: partySize,
      amount_kes: amountKes,
      commission_kes: commission,
      status: "pending",
    })
    .select("id")
    .single();

  if (bookingErr || !booking) {
    await service.rpc("release_slot", { p_slot_id: input.slotId, p_qty: partySize });
    return { ok: false, error: t("err_book_start") };
  }

  const { data: payment, error: payErr } = await service
    .from("payments")
    .insert({
      booking_id: booking.id,
      provider: provider.name,
      amount_kes: amountKes,
      status: "pending",
    })
    .select("id")
    .single();

  if (payErr || !payment) {
    await service.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
    await service.rpc("release_slot", { p_slot_id: input.slotId, p_qty: partySize });
    return { ok: false, error: t("err_book_paystart") };
  }

  // Initiate STK. "Accepted" only means the prompt was sent (§4.2).
  const result = await provider.initiateStk({
    amountKes,
    phone,
    reference: booking.id,
    narrative: `RoaVa: ${exp.title}`.slice(0, 60),
  });

  if (!result.ok) {
    await service
      .from("payments")
      .update({ status: "failed", failure_reason: "initiation_failed" })
      .eq("id", payment.id);
    await service.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
    await service.rpc("release_slot", { p_slot_id: input.slotId, p_qty: partySize });
    return { ok: false, error: t("err_book_mpesa") };
  }

  await service
    .from("payments")
    .update({ provider_ref: result.providerRef })
    .eq("id", payment.id);

  return { ok: true, bookingId: booking.id };
}
