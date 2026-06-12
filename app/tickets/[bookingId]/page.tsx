import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { renderQrSvg } from "@/lib/qr";
import { formatSlotDateTime } from "@/lib/format";
import { TicketClock } from "@/components/ticket-clock";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  await requireProfile(`/tickets/${bookingId}`);

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      `id, status, party_size,
       experiences ( title, meeting_point ),
       availability_slots ( start_at ),
       tickets ( qr_payload, status, checked_in_at )`,
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) notFound();

  const exp = booking.experiences as unknown as {
    title: string;
    meeting_point: string | null;
  };
  const slot = booking.availability_slots as unknown as { start_at: string };
  // booking_id is unique → PostgREST embeds tickets as a single object (or null).
  const ticket = booking.tickets as unknown as {
    qr_payload: string;
    status: string;
    checked_in_at: string | null;
  } | null;

  const used = ticket?.status === "used";
  const qrSvg = ticket ? await renderQrSvg(ticket.qr_payload) : null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <Link href="/tickets" className="text-small text-muted">
        ← Your tickets
      </Link>

      <div className="border-hairline rounded-card bg-surface flex flex-col gap-5 border p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-h2 text-foreground">{exp.title}</h1>
            <p className="text-small text-muted">
              {formatSlotDateTime(slot.start_at)}
            </p>
          </div>
          <span
            className={`text-caption rounded-base px-2 py-1 ${
              used ? "bg-muted/15 text-muted" : "bg-success/15 text-success"
            }`}
          >
            {used ? "Used" : "Valid"}
          </span>
        </div>

        {qrSvg ? (
          <div className="flex flex-col items-center gap-3">
            <div
              className={`overflow-hidden rounded-card bg-white p-3 ${used ? "opacity-40" : ""}`}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: qrSvg }}
              aria-label="Ticket QR code"
            />
            {used ? (
              <p className="text-small text-muted">
                Checked in
                {ticket.checked_in_at
                  ? ` · ${formatSlotDateTime(ticket.checked_in_at)}`
                  : ""}
              </p>
            ) : (
              <TicketClock />
            )}
          </div>
        ) : (
          <p className="text-small text-muted">
            Your ticket is being prepared. Refresh in a moment.
          </p>
        )}

        <div className="border-hairline flex flex-col gap-2 border-t pt-4">
          <Row
            label="Guests"
            value={`${booking.party_size} ${booking.party_size === 1 ? "guest" : "guests"}`}
          />
          <Row label="Meeting point" value={exp.meeting_point ?? "—"} />
          <Row label="Booking ref" value={booking.id.slice(0, 8).toUpperCase()} />
        </div>
      </div>

      <p className="text-caption text-muted text-center">
        Show this QR at the meeting point. It works offline — keep this page
        open. Each ticket can be used once.
      </p>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-small text-muted">{label}</span>
      <span className="text-small text-foreground text-right">{value}</span>
    </div>
  );
}
