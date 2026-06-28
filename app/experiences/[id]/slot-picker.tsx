"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { Button } from "@/components/ui/button";
import { CountUpKes } from "@/components/count-up-kes";
import { formatKes, formatSlotDateTime } from "@/lib/format";
import type { DetailSlot } from "@/lib/experiences";

const SETTLE = [0.22, 1, 0.36, 1] as const;

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
    <div className="glass-strong border-hairline rounded-card flex flex-col gap-4 border p-4">
      <div className="flex flex-col gap-2">
        <span className="text-small text-foreground">{labels.chooseDate}</span>
        <div className="flex flex-col gap-2">
          {slots.map((slot) => {
            const active = slot.id === selected.id;
            const low = slot.seatsLeft <= 3;
            return (
              <m.button
                key={slot.id}
                type="button"
                whileTap={{ scale: 0.985 }}
                transition={{ duration: 0.18, ease: SETTLE }}
                onClick={() => {
                  setSelectedId(slot.id);
                  setParty((p) => Math.min(p, slot.seatsLeft));
                }}
                className={`ease-out-soft flex min-h-12 items-center justify-between rounded-base px-3 text-left transition-colors duration-200 ${
                  active
                    ? "bg-accent-soft border-sunset border"
                    : "border-hairline border"
                }`}
              >
                <span className="flex items-center gap-2">
                  {/* Animated tick marks the chosen slot — a second, non-colour
                      cue (icon) beside the coral tint (§7). */}
                  <AnimatePresence initial={false}>
                    {active ? (
                      <m.span
                        key="check"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="text-sunset flex shrink-0"
                        aria-hidden
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </m.span>
                    ) : null}
                  </AnimatePresence>
                  <span className="text-small text-foreground">
                    {formatSlotDateTime(slot.startAt)}
                  </span>
                </span>
                <span
                  className={`text-caption ${low ? "text-warning" : "text-muted"}`}
                >
                  {low
                    ? labels.onlyLeft.replace("{n}", String(slot.seatsLeft))
                    : labels.seats.replace("{n}", String(slot.seatsLeft))}
                </span>
              </m.button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-small text-foreground">{labels.guests}</span>
        <div className="flex items-center gap-3">
          <m.button
            type="button"
            aria-label={labels.fewer}
            whileTap={{ scale: 0.88 }}
            transition={{ duration: 0.15, ease: SETTLE }}
            onClick={() => setParty((p) => Math.max(1, p - 1))}
            disabled={safeParty <= 1}
            className="border-hairline text-h3 text-foreground flex h-10 w-10 items-center justify-center rounded-full border disabled:opacity-40"
          >
            −
          </m.button>
          {/* Keyed span re-mounts on each change, so the new count pops in. */}
          <span className="text-body text-foreground w-6 overflow-hidden text-center">
            <m.span
              key={safeParty}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2, ease: SETTLE }}
              className="inline-block"
            >
              {safeParty}
            </m.span>
          </span>
          <m.button
            type="button"
            aria-label={labels.more}
            whileTap={{ scale: 0.88 }}
            transition={{ duration: 0.15, ease: SETTLE }}
            onClick={() => setParty((p) => Math.min(maxParty, p + 1))}
            disabled={safeParty >= maxParty}
            className="border-hairline text-h3 text-foreground flex h-10 w-10 items-center justify-center rounded-full border disabled:opacity-40"
          >
            +
          </m.button>
        </div>
      </div>

      <div className="border-hairline flex items-center justify-between border-t pt-3">
        <div className="flex flex-col">
          <span className="text-h2 text-foreground tabular-nums">
            <CountUpKes value={total} />
          </span>
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
