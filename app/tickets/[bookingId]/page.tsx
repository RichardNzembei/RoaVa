import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { renderQrSvg } from "@/lib/qr";
import { formatSlotDateTime } from "@/lib/format";
import { getT } from "@/lib/i18n";
import { TicketClock } from "@/components/ticket-clock";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  await requireProfile(`/tickets/${bookingId}`);
  const t = await getT();

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
        ← {t("tickets_title")}
      </Link>

      {/* Boarding-pass styled ticket — coloured stub, perforation, framed QR. */}
      <div className="shadow-card relative overflow-hidden rounded-card">
        {/* Stub header */}
        <div className="bg-accent-strong text-accent-contrast flex items-start justify-between gap-3 p-5">
          <div className="flex flex-col gap-0.5">
            <span className="text-caption opacity-80">RoaVa</span>
            <h1 className="text-h2">{exp.title}</h1>
            <p className="text-small opacity-90">
              {formatSlotDateTime(slot.start_at)}
            </p>
          </div>
          <span
            className={`text-caption rounded-full px-2.5 py-1 backdrop-blur-sm ${
              used ? "bg-ink/25" : "bg-white/20"
            }`}
          >
            {used ? t("ticket_used") : t("ticket_valid")}
          </span>
        </div>

        {/* Perforation — notched edges + dashed tear line */}
        <div className="bg-surface relative h-3">
          <span className="bg-background absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full" />
          <span className="bg-background absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full" />
          <div className="border-border absolute inset-x-5 top-1/2 border-t border-dashed" />
        </div>

        {/* Body */}
        <div className="bg-surface flex flex-col gap-5 px-6 pb-6 pt-3">
          {qrSvg ? (
            <div className="flex flex-col items-center gap-3">
              <div
                className={`ring-border overflow-hidden rounded-card bg-white p-3 ring-1 ${used ? "opacity-40" : ""}`}
                dangerouslySetInnerHTML={{ __html: qrSvg }}
                aria-label="Ticket QR code"
              />
              {used ? (
                <p className="text-small text-muted">
                  {t("op_checked_in")}
                  {ticket.checked_in_at
                    ? ` · ${formatSlotDateTime(ticket.checked_in_at)}`
                    : ""}
                </p>
              ) : (
                <TicketClock />
              )}
            </div>
          ) : (
            <p className="text-small text-muted">{t("ticket_preparing")}</p>
          )}

          <div className="border-hairline flex flex-col gap-2 border-t pt-4">
            <Row
              label={t("slot_guests")}
              value={`${booking.party_size} ${booking.party_size === 1 ? t("guest_one") : t("guest_many")}`}
            />
            <Row label={t("detail_meeting")} value={exp.meeting_point ?? "—"} />
            <Row
              label={t("ticket_ref")}
              value={booking.id.slice(0, 8).toUpperCase()}
            />
          </div>
        </div>
      </div>

      <p className="text-caption text-muted text-center">{t("ticket_note")}</p>
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
