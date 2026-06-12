import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { getSmsProvider } from "@/lib/sms";
import { reportError } from "@/lib/observability";
import { formatKes, formatSlotDateTime } from "@/lib/format";

// Transactional confirmation SMS on a confirmed booking (CLAUDE.md §6.4).
// Best-effort: a failed SMS must never affect the confirmed booking.
export async function sendBookingConfirmedSms(bookingId: string): Promise<void> {
  try {
    const service = createServiceClient();
    const { data: booking } = await service
      .from("bookings")
      .select(
        `amount_kes,
         profiles ( phone ),
         experiences ( title ),
         availability_slots ( start_at )`,
      )
      .eq("id", bookingId)
      .maybeSingle();
    if (!booking) return;

    const phone = (booking.profiles as unknown as { phone: string | null })?.phone;
    if (!phone) return;
    const exp = booking.experiences as unknown as { title: string };
    const slot = booking.availability_slots as unknown as { start_at: string };

    const to = phone.startsWith("+") ? phone : `+${phone}`;
    const ref = bookingId.slice(0, 8).toUpperCase();
    const message =
      `RoaVa: booking confirmed for ${exp.title} on ${formatSlotDateTime(slot.start_at)}. ` +
      `Paid ${formatKes(booking.amount_kes)}. Ref ${ref}. Show your QR ticket at the meeting point.`;

    await getSmsProvider().send(to, message);
  } catch (e) {
    // Don't fail the (already successful) confirmation, but surface it.
    reportError(e, { where: "sendBookingConfirmedSms", bookingId });
  }
}
