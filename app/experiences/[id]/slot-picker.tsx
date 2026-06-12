"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatKes, formatSlotDateTime } from "@/lib/format";
import type { DetailSlot } from "@/lib/experiences";

// Localised strings passed in from the (server) detail page.
export type SlotPickerLabels = {
  chooseDate: string;
  guests: string;
  seats: string; // "{n} seats"
  onlyLeft: string; // "Only {n} left"
  fewer: string;
  more: string;
  guestOne: string;
  guestMany: string;
  continue: string;
  none: string;
};

export function SlotPicker({
  experienceId,
  slots,
  maxPartySize,
  labels,
}: {
  experienceId: string;
  slots: DetailSlot[];
  maxPartySize: number;
  labels: SlotPickerLabels;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(
    slots[0]?.id ?? null,
  );
  const [party, setParty] = useState(1);

  if (slots.length === 0) {
    return (
      <div className="border-hairline rounded-card bg-surface border p-4">
        <p className="text-small text-muted">{labels.none}</p>
      </div>
    );
  }

  const selected = slots.find((s) => s.id === selectedId) ?? slots[0];
  const maxParty = Math.min(maxPartySize, selected.seatsLeft);
  const safeParty = Math.min(party, maxParty);
  const total = selected.priceKes * safeParty;

  return (
    <div className="border-hairline rounded-card bg-surface flex flex-col gap-4 border p-4">
      <div className="flex flex-col gap-2">
        <span className="text-small text-foreground">{labels.chooseDate}</span>
        <div className="flex flex-col gap-2">
          {slots.map((slot) => {
            const active = slot.id === selected.id;
            const low = slot.seatsLeft <= 3;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => {
                  setSelectedId(slot.id);
                  setParty((p) => Math.min(p, slot.seatsLeft));
                }}
                className={`flex min-h-12 items-center justify-between rounded-base px-3 text-left ${
                  active
                    ? "bg-accent-soft border-sunset border"
                    : "border-hairline border"
                }`}
              >
                <span className="text-small text-foreground">
                  {formatSlotDateTime(slot.startAt)}
                </span>
                <span
                  className={`text-caption ${low ? "text-warning" : "text-muted"}`}
                >
                  {low
                    ? labels.onlyLeft.replace("{n}", String(slot.seatsLeft))
                    : labels.seats.replace("{n}", String(slot.seatsLeft))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-small text-foreground">{labels.guests}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={labels.fewer}
            onClick={() => setParty((p) => Math.max(1, p - 1))}
            disabled={safeParty <= 1}
            className="border-hairline text-h3 text-foreground flex h-10 w-10 items-center justify-center rounded-full border disabled:opacity-40"
          >
            −
          </button>
          <span className="text-body text-foreground w-6 text-center">
            {safeParty}
          </span>
          <button
            type="button"
            aria-label={labels.more}
            onClick={() => setParty((p) => Math.min(maxParty, p + 1))}
            disabled={safeParty >= maxParty}
            className="border-hairline text-h3 text-foreground flex h-10 w-10 items-center justify-center rounded-full border disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      <div className="border-hairline flex items-center justify-between border-t pt-3">
        <div className="flex flex-col">
          <span className="text-h2 text-foreground">{formatKes(total)}</span>
          <span className="text-caption text-muted">
            {formatKes(selected.priceKes)} × {safeParty}{" "}
            {safeParty === 1 ? labels.guestOne : labels.guestMany}
          </span>
        </div>
        <Button
          type="button"
          onClick={() =>
            router.push(
              `/experiences/${experienceId}/book?slot=${selected.id}&party=${safeParty}`,
            )
          }
        >
          {labels.continue}
        </Button>
      </div>
    </div>
  );
}
