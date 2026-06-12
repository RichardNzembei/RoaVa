import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { fetchExperienceDetail } from "@/lib/experiences";
import { formatKes, formatSlotDateTime } from "@/lib/format";
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

  const exp = await fetchExperienceDetail(id);
  if (!exp) notFound();

  const slot = exp.slots.find((s) => s.id === slotId);
  if (!slot) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-5 py-8">
        <h1 className="text-h1 text-foreground">That slot isn&apos;t available</h1>
        <p className="text-body text-muted">Pick another date for {exp.title}.</p>
        <Link href={`/experiences/${exp.id}`} className="text-small text-sunset">
          ← Back to the experience
        </Link>
      </main>
    );
  }

  const party = Math.max(1, Math.min(Number(partyRaw) || 1, slot.seatsLeft));
  const total = slot.priceKes * party;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-8">
      <Link href={`/experiences/${exp.id}`} className="text-small text-muted">
        ← Back
      </Link>
      <h1 className="text-h1 text-foreground">Confirm and pay</h1>

      <div className="border-hairline rounded-card bg-surface flex flex-col gap-3 border p-4">
        <Row label="Experience" value={exp.title} />
        <Row label="Date" value={formatSlotDateTime(slot.startAt)} />
        <Row label="Guests" value={String(party)} />
        <Row label="Meeting point" value={exp.meetingPoint ?? "—"} />
        <div className="border-hairline flex items-center justify-between border-t pt-3">
          <span className="text-h3 text-foreground">Total</span>
          <span className="text-h2 text-foreground">{formatKes(total)}</span>
        </div>
      </div>

      {exp.cancellationPolicy ? (
        <p className="text-caption text-muted">{exp.cancellationPolicy}</p>
      ) : null}

      <CheckoutForm
        experienceId={exp.id}
        slotId={slot.id}
        party={party}
        defaultPhone={profile.phone ?? ""}
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
