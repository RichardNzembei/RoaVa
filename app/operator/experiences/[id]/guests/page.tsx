import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOperator } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { formatSlotDateTime } from "@/lib/format";

// Guest roster for the operator's day. Consumer names are RLS-private, so we
// fetch via the service client AFTER confirming this operator owns the
// experience — they only ever see their own guests.
export default async function GuestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const operator = await requireOperator();

  const supabase = await createClient();
  const { data: exp } = await supabase
    .from("experiences")
    .select("id, title, operator_id")
    .eq("id", id)
    .maybeSingle();
  if (!exp || exp.operator_id !== operator.id) notFound();

  const service = createServiceClient();
  const { data: bookings } = await service
    .from("bookings")
    .select(
      `id, party_size, status,
       profiles ( name ),
       availability_slots ( id, start_at ),
       tickets ( status, checked_in_at )`,
    )
    .eq("experience_id", id)
    .in("status", ["confirmed", "completed"])
    .order("created_at", { ascending: true });

  // Group by slot, upcoming-ish first (by slot start).
  const bySlot = new Map<
    string,
    { startAt: string; rows: typeof bookings }
  >();
  for (const b of bookings ?? []) {
    const slot = b.availability_slots as unknown as {
      id: string;
      start_at: string;
    };
    const entry = bySlot.get(slot.id) ?? { startAt: slot.start_at, rows: [] };
    entry.rows!.push(b);
    bySlot.set(slot.id, entry);
  }
  const slots = [...bySlot.values()].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );

  const totalGuests = (bookings ?? []).reduce((s, b) => s + b.party_size, 0);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-8">
      <div className="flex flex-col gap-1">
        <Link
          href={`/operator/experiences/${id}`}
          className="text-small text-muted"
        >
          ← {exp.title}
        </Link>
        <h1 className="text-h1 text-foreground">Guests</h1>
        <p className="text-small text-muted">
          {totalGuests} {totalGuests === 1 ? "guest" : "guests"} booked across{" "}
          {slots.length} {slots.length === 1 ? "date" : "dates"}.
        </p>
      </div>

      {slots.length === 0 ? (
        <p className="text-small text-muted">
          No confirmed bookings yet. Guests appear here once they&apos;ve paid.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {slots.map((slot) => (
            <section key={slot.startAt} className="flex flex-col gap-2">
              <h2 className="text-h3 text-foreground">
                {formatSlotDateTime(slot.startAt)}
              </h2>
              <ul className="border-hairline rounded-card bg-surface divide-y divide-border border">
                {(slot.rows ?? []).map((b) => {
                  const profile = b.profiles as unknown as {
                    name: string | null;
                  };
                  const ticket = b.tickets as unknown as {
                    status: string;
                  } | null;
                  const checkedIn = ticket?.status === "used";
                  return (
                    <li
                      key={b.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-body text-foreground">
                          {profile?.name ?? "Guest"}
                        </span>
                        <span className="text-caption text-muted">
                          {b.party_size}{" "}
                          {b.party_size === 1 ? "guest" : "guests"}
                        </span>
                      </div>
                      <span
                        className={`text-caption rounded-base px-2 py-1 ${
                          checkedIn
                            ? "bg-success/15 text-success"
                            : "bg-warning/15 text-warning"
                        }`}
                      >
                        {checkedIn ? "Checked in" : "Expected"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
