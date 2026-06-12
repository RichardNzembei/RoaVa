import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatSlotDateTime } from "@/lib/format";

// The ticket wallet — confirmed/completed bookings the user can show at the gate.
export default async function TicketsPage() {
  await requireProfile("/tickets");
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      `id, status, party_size,
       experiences ( title ),
       availability_slots ( start_at ),
       tickets ( status ),
       reviews ( id )`,
    )
    .in("status", ["confirmed", "completed"])
    .order("created_at", { ascending: false });

  const list = bookings ?? [];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-8">
      <h1 className="text-h1 text-foreground">Your tickets</h1>

      {list.length === 0 ? (
        <div className="border-hairline rounded-card bg-surface flex flex-col items-start gap-2 border p-6">
          <h2 className="text-h3 text-foreground">No tickets yet</h2>
          <p className="text-small text-muted">
            Book an experience and your QR ticket will appear here — ready to
            show even without signal.
          </p>
          <Link href="/experiences" className="text-small text-sunset">
            Explore experiences
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((b) => {
            const exp = b.experiences as unknown as { title: string };
            const slot = b.availability_slots as unknown as { start_at: string };
            const ticket = b.tickets as unknown as { status: string } | null;
            const review = b.reviews as unknown as { id: string } | null;
            const used = ticket?.status === "used";
            const canReview = b.status === "completed" && !review;
            return (
              <li key={b.id} className="flex flex-col">
                <Link
                  href={`/tickets/${b.id}`}
                  className={`border-hairline bg-surface flex items-center justify-between gap-4 border p-4 active:bg-accent-soft ${
                    canReview ? "rounded-t-card" : "rounded-card"
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-h3 text-foreground">{exp.title}</span>
                    <span className="text-small text-muted">
                      {formatSlotDateTime(slot.start_at)} ·{" "}
                      {b.party_size} {b.party_size === 1 ? "guest" : "guests"}
                    </span>
                  </div>
                  <span
                    className={`text-caption rounded-base px-2 py-1 ${
                      used
                        ? "bg-muted/15 text-muted"
                        : "bg-success/15 text-success"
                    }`}
                  >
                    {used ? "Used" : "Valid"}
                  </span>
                </Link>
                {canReview ? (
                  <Link
                    href={`/bookings/${b.id}/review`}
                    className="border-hairline rounded-b-card bg-accent-soft text-sunset text-small border border-t-0 px-4 py-2.5"
                  >
                    ★ Leave a review
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
