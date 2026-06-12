import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { manualPayment } from "@/lib/env";
import { formatKes, formatSlotDateTime } from "@/lib/format";
import { BookingStatus } from "./booking-status";

export default async function BookingStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProfile(`/bookings/${id}`);

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      `id, status, party_size, amount_kes, experience_id, slot_id,
       experiences ( title ),
       availability_slots ( start_at )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!booking) notFound();

  const experience = booking.experiences as unknown as { title: string };
  const slot = booking.availability_slots as unknown as { start_at: string };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-10">
      <BookingStatus
        bookingId={booking.id}
        initialStatus={booking.status}
        title={experience.title}
        dateLabel={formatSlotDateTime(slot.start_at)}
        party={booking.party_size}
        amountLabel={formatKes(booking.amount_kes)}
        retryHref={`/experiences/${booking.experience_id}/book?slot=${booking.slot_id}&party=${booking.party_size}`}
        manualPaybill={manualPayment.enabled ? manualPayment.paybill : null}
      />
    </main>
  );
}
