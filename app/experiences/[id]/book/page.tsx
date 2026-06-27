import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { fetchExperienceDetail } from "@/lib/experiences";
import { formatKes, formatSlotDateTime } from "@/lib/format";
import { getT } from "@/lib/i18n";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ slot?: string; party?: string }>;
}) {
  const { id } = await params;
  const { slot: slotId, party: partyRaw } = await searchParams;

  // Sign-in (phone OTP) is required to pay — it's the lightweight account.
  const returnTo = `/experiences/${id}/book?slot=${slotId ?? ""}&party=${partyRaw ?? "1"}`;
  const profile = await requireProfile(returnTo);
  const t = await getT();

  const exp = await fetchExperienceDetail(id);
  if (!exp) notFound();

  const slot = exp.slots.find((s) => s.id === slotId);
  if (!slot) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 py-8">
        <h1 className="text-h1 text-foreground">
          {t("checkout_unavailable_title")}
        </h1>
        <p className="text-body text-muted">
          {t("checkout_unavailable_body").replace("{title}", exp.title)}
        </p>
        <Link href={`/experiences/${exp.id}`} className="text-small text-sunset">
          ← {t("checkout_back_experience")}
        </Link>
      </main>
    );
  }

  const party = Math.max(1, Math.min(Number(partyRaw) || 1, slot.seatsLeft));
  const total = slot.priceKes * party;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <Link href={`/experiences/${exp.id}`} className="text-small text-muted">
        ← {t("checkout_back")}
      </Link>
      <h1 className="text-h1 text-foreground">{t("checkout_title")}</h1>

      <div className="glass-strong border-hairline rounded-card flex flex-col gap-3 border p-4">
        <Row label={t("checkout_experience")} value={exp.title} />
        <Row label={t("checkout_date")} value={formatSlotDateTime(slot.startAt)} />
        <Row label={t("checkout_guests")} value={String(party)} />
        <Row label={t("checkout_meeting")} value={exp.meetingPoint ?? "—"} />
        <div className="border-hairline flex items-center justify-between border-t pt-3">
          <span className="text-h3 text-foreground">{t("checkout_total")}</span>
          <span className="text-h2 text-foreground">{formatKes(total)}</span>
        </div>
      </div>

      {/* Cancellation terms always shown BEFORE payment — fall back to the
          platform default when the operator hasn't set a specific policy. */}
      <p className="text-caption text-muted">
        {exp.cancellationPolicy?.trim() || t("cancellation_default")}
      </p>

      <CheckoutForm
        experienceId={exp.id}
        slotId={slot.id}
        party={party}
        defaultPhone={profile.phone ?? ""}
        labels={{
          mpesaLabel: t("checkout_mpesa_label"),
          mpesaHint: t("checkout_mpesa_hint"),
          pay: t("checkout_pay"),
          paying: t("checkout_paying"),
          payNote: t("checkout_pay_note"),
          giftToggle: t("gift_toggle"),
          giftRecipientLabel: t("gift_recipient_label"),
          giftRecipientHint: t("gift_recipient_hint"),
          giftMessageLabel: t("gift_message_label"),
        }}
      />
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
