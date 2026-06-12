import Link from "next/link";
import { requireOperator } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatKes, formatSlotDateTime } from "@/lib/format";
import { getT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { sendPayout } from "./actions";
import { PayoutNumberForm } from "./payout-number-form";

// Per-booking payout state → badge class. Colour is always paired with a label (§7).
const BADGE_CLASS: Record<string, string> = {
  not_applicable: "bg-warning/15 text-warning",
  pending: "bg-accent-soft text-sunset",
  paid: "bg-success/15 text-success",
  failed: "bg-danger/15 text-danger",
};

export default async function PayoutsPage() {
  const operator = await requireOperator("/operator/payouts");
  const t = await getT();
  const supabase = await createClient();

  // Per-state badge labels (localised).
  const badgeLabel: Record<string, string> = {
    not_applicable: t("pay_owed"),
    pending: t("pay_sending"),
    paid: t("pay_badge_paid"),
    failed: t("pay_badge_failed"),
  };

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

  const hasPayoutNumber = Boolean(payout?.payout_msisdn);

  const totalGross = rows.reduce((s, b) => s + b.amount_kes, 0);
  const totalNet = rows.reduce((s, b) => s + net(b), 0);
  const totalPaid = rows
    .filter((b) => b.payout_status === "paid")
    .reduce((s, b) => s + net(b), 0);
  const totalSending = rows
    .filter((b) => b.payout_status === "pending")
    .reduce((s, b) => s + net(b), 0);
  // "Owed" = net earned that hasn't been paid out and isn't currently in flight.
  const owed = totalNet - totalPaid - totalSending;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-8">
      <div className="flex flex-col gap-1">
        <Link href="/operator" className="text-small text-muted">
          ← {t("op_back")}
        </Link>
        <h1 className="text-h1 text-foreground">{t("pay_title")}</h1>
        <p className="text-small text-muted">{t("pay_subtitle")}</p>
      </div>

      <PayoutNumberForm
        current={payout?.payout_msisdn ?? null}
        labels={{
          title: t("pay_num_title"),
          set: t("pay_num_set"),
          unset: t("pay_num_unset"),
          label: t("pay_num_label"),
          saving: t("pay_saving"),
          update: t("pay_update"),
          save: t("pay_save"),
          saved: t("pay_num_saved"),
        }}
      />

      <div className="grid grid-cols-3 gap-3">
        <Stat label={t("pay_net")} value={formatKes(totalNet)} />
        <Stat label={t("pay_paid")} value={formatKes(totalPaid)} tone="savanna" />
        <Stat
          label={totalSending > 0 ? t("pay_sending") : t("pay_owed")}
          value={formatKes(totalSending > 0 ? totalSending : owed)}
          tone="sunset"
        />
      </div>

      {rows.length === 0 ? (
        <p className="text-small text-muted">{t("pay_none")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((b) => {
            const exp = b.experiences as unknown as { title: string };
            const slot = b.availability_slots as unknown as { start_at: string };
            const status = b.payout_status; // not_applicable | pending | paid | failed
            const badgeClass = BADGE_CLASS[status] ?? BADGE_CLASS.not_applicable;
            // A payout can be sent when nothing is in flight or it previously failed.
            const canSend = status === "not_applicable" || status === "failed";
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
                      {b.party_size === 1 ? t("guest_one") : t("guest_many")}
                    </span>
                  </div>
                  <span className={`text-caption rounded-base px-2 py-1 ${badgeClass}`}>
                    {badgeLabel[status] ?? badgeLabel.not_applicable}
                  </span>
                </div>
                <div className="border-hairline flex items-center justify-between gap-3 border-t pt-3">
                  <div className="text-caption text-muted">
                    {t("pay_gross_fee")
                      .replace("{gross}", formatKes(b.amount_kes))
                      .replace("{fee}", formatKes(b.commission_kes))}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-h3 text-foreground">
                      {formatKes(net(b))}
                    </span>
                    {canSend && hasPayoutNumber ? (
                      <form action={sendPayout.bind(null, b.id)}>
                        <Button type="submit" variant="secondary">
                          {status === "failed" ? t("pay_retry") : t("pay_send")}
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
                {status === "failed" ? (
                  <p className="text-caption text-danger">{t("pay_failed_msg")}</p>
                ) : null}
                {canSend && !hasPayoutNumber ? (
                  <p className="text-caption text-muted">{t("pay_need_number")}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-caption text-muted">
        {t("pay_noncustodial").replace("{total}", formatKes(totalGross))}
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
