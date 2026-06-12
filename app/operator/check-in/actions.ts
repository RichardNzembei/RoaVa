"use server";

import { requireOperator } from "@/lib/auth";
import { verifyTicket } from "@/lib/tickets";
import { createServiceClient } from "@/lib/supabase/service";
import { formatSlotDateTime } from "@/lib/format";

export type CheckInResult = {
  status: "ok" | "used" | "not_owner" | "not_confirmed" | "invalid";
  guest?: string;
  experience?: string;
  when?: string;
  party?: number;
};

// Verify the signed token, then atomically claim the ticket (check_in_ticket).
// Signature check happens here (server-only secret); the DB enforces single-use
// and ownership.
export async function checkInTicket(token: string): Promise<CheckInResult> {
  const operator = await requireOperator();

  const parsed = verifyTicket(token.trim());
  if (!parsed) return { status: "invalid" };

  const service = createServiceClient();
  const { data: status, error } = await service.rpc("check_in_ticket", {
    p_booking_id: parsed.bookingId,
    p_nonce: parsed.nonce,
    p_operator_profile: operator.owner_profile_id,
  });
  if (error || !status) return { status: "invalid" };

  const result = status as CheckInResult["status"];

  // Enrich ok/used results with who's coming, for the gate attendant.
  if (result === "ok" || result === "used") {
    const { data: booking } = await service
      .from("bookings")
      .select(
        `party_size,
         profiles ( name ),
         experiences ( title ),
         availability_slots ( start_at )`,
      )
      .eq("id", parsed.bookingId)
      .maybeSingle();

    if (booking) {
      const profile = booking.profiles as unknown as { name: string | null };
      const exp = booking.experiences as unknown as { title: string };
      const slot = booking.availability_slots as unknown as { start_at: string };
      return {
        status: result,
        guest: profile?.name ?? "Guest",
        experience: exp?.title,
        when: slot ? formatSlotDateTime(slot.start_at) : undefined,
        party: booking.party_size,
      };
    }
  }

  return { status: result };
}
