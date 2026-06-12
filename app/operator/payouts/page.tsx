import Link from "next/link";
import { requireOperator } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatKes, formatSlotDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { recordPayout } from "./actions";
import { PayoutNumberForm } from "./payout-number-form";

export default async function PayoutsPage() {
  const operator = await requireOperator("/operator/payouts");
  const supabase = await createClient();

  // Completed bookings for this operator's experiences (RLS scopes to owner).
  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      `id, amount_kes, commission_kes, payout_status, party_size,
       experiences!inner ( title, operator_id ),
       availability_slots ( start_at )`,
    )
    .eq("experiences.operator_id", operator.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const { data: payout } = await supabase
    .from("operator_payouts")
    .select("payout_msisdn")
    .eq("operator_id", operator.id)
    .maybeSingle();

  const rows = bookings ?? [];
  const net = (b: { amount_kes: number; commission_kes: number }) =>
    b.amount_kes - b.commission_kes;

  const totalGross = rows.reduce((s, b) => s + b.amount_kes, 0);
  const totalNet = rows.reduce((s, b) => s + net(b), 0);
  const totalPaid = rows
    .filter((b) => b.payout_status === "paid")
    .reduce((s, b) => s + net(b), 0);
  const owed = totalNet - totalPaid;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-8">
      <div className="flex flex-col gap-1">
        <Link href="/operator" className="text-small text-muted">
          ← Back to dashboard
        </Link>
        <h1 className="text-h1 text-foreground">Earnings & payouts</h1>
        <p className="text-small text-muted">
          Your share after the {""}
          RoaVa commission. Paid to your M-Pesa.
        </p>
      </div>

      <PayoutNumberForm current={payout?.payout_msisdn ?? null} />

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Net earned" value={formatKes(totalNet)} />
        <Stat label="Paid out" value={formatKes(totalPaid)} tone="savanna" />
        <Stat label="Owed" value={formatKes(owed)} tone="sunset" />
      </div>

      {rows.length === 0 ? (
        <p className="text-small text-muted">
          No completed trips yet. Earnings appear here after guests attend.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((b) => {
            const exp = b.experiences as unknown as { title: string };
            const slot = b.availability_slots as unknown as { start_at: string };
            const paid = b.payout_status === "paid";
            return (
              <li
                key={b.id}
                className="border-hairline rounded-card bg-surface flex flex-col gap-3 border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-h3 text-foreground">{exp.title}</span>
                    <span className="text-caption text-muted">
                      {formatSlotDateTime(slot.start_at)} · {b.party_size}{" "}
                      {b.party_size === 1 ? "guest" : "guests"}
                    </span>
                  </div>
                  <span
                    className={`text-caption rounded-base px-2 py-1 ${
                      paid ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                    }`}
                  >
                    {paid ? "Paid" : "Owed"}
                  </span>
                </div>
                <div className="border-hairline flex items-center justify-between border-t pt-3">
                  <div className="text-caption text-muted">
                    Gross {formatKes(b.amount_kes)} · fee{" "}
                    {formatKes(b.commission_kes)}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-h3 text-foreground">
                      {formatKes(net(b))}
                    </span>
                    {!paid ? (
                      <form action={recordPayout.bind(null, b.id)}>
                        <Button type="submit" variant="secondary">
                          Record payout
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-caption text-muted">
        RoaVa is non-custodial: payments settle through the licensed provider
        and your share is disbursed to your M-Pesa — funds are never held by
        RoaVa. Total handled: {formatKes(totalGross)}.
      </p>
    </main>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "savanna" | "sunset";
}) {
  const color =
    tone === "savanna" ? "text-savanna" : tone === "sunset" ? "text-sunset" : "text-foreground";
  return (
    <div className="border-hairline rounded-card bg-surface flex flex-col gap-1 border p-3">
      <span className="text-caption text-muted">{label}</span>
      <span className={`text-h3 ${color}`}>{value}</span>
    </div>
  );
}
