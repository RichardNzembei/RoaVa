"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { formatSlotDateTime } from "@/lib/format";
import { addSlots, deleteSlot, type SlotFormState } from "../slot-actions";
import type { Database } from "@/lib/database.types";

type Slot = Database["public"]["Tables"]["availability_slots"]["Row"];

export type SlotManagerLabels = {
  date: string;
  time: string;
  capacity: string;
  repeat: string;
  repeatHint: string;
  priceOverride: string;
  priceOverridePh: string;
  adding: string;
  addSlot: string;
  close: string;
  remove: string;
  slotAria: string; // "{action} slot {date}"
  addedOne: string; // "Added {n} slot."
  addedMany: string; // "Added {n} slots."
  noSlots: string;
  booked: string; // "{booked}/{capacity} booked"
};

function AddButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? busy : idle}
    </Button>
  );
}

function DeleteSlotButton({
  experienceId,
  slot,
  labels,
}: {
  experienceId: string;
  slot: Slot;
  labels: SlotManagerLabels;
}) {
  const action = deleteSlot.bind(null, experienceId, slot.id);
  const label = slot.booked_count > 0 ? labels.close : labels.remove;
  return (
    <form action={action}>
      <button
        type="submit"
        className="text-caption text-muted active:text-danger"
        aria-label={labels.slotAria
          .replace("{action}", label)
          .replace("{date}", formatSlotDateTime(slot.start_at))}
      >
        {label}
      </button>
    </form>
  );
}

export function SlotManager({
  experienceId,
  slots,
  labels,
}: {
  experienceId: string;
  slots: Slot[];
  labels: SlotManagerLabels;
}) {
  const action = addSlots.bind(null, experienceId);
  const [state, formAction] = useActionState<SlotFormState, FormData>(action, {
    status: "idle",
  });
  // Snapshot "now" once (lazy init) so past-slot styling stays pure during render.
  const [nowMs] = useState(() => Date.now());

  return (
    <div className="flex flex-col gap-5">
      <form
        action={formAction}
        className="border-hairline rounded-card bg-surface flex flex-col gap-4 border p-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <TextField label={labels.date} name="date" type="date" />
          <TextField label={labels.time} name="time" type="time" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label={labels.capacity}
            name="capacity"
            inputMode="numeric"
            defaultValue="10"
          />
          <TextField
            label={labels.repeat}
            name="repeat_weeks"
            inputMode="numeric"
            defaultValue="1"
            hint={labels.repeatHint}
          />
        </div>
        <TextField
          label={labels.priceOverride}
          name="price_override"
          inputMode="numeric"
          placeholder={labels.priceOverridePh}
        />
        <div className="flex items-center gap-3">
          <AddButton idle={labels.addSlot} busy={labels.adding} />
          {state.status === "error" ? (
            <span className="text-caption text-danger" aria-live="polite">
              {state.message}
            </span>
          ) : state.status === "success" ? (
            <span className="text-caption text-success" aria-live="polite">
              {(state.added === 1 ? labels.addedOne : labels.addedMany).replace(
                "{n}",
                String(state.added),
              )}
            </span>
          ) : null}
        </div>
      </form>

      {slots.length === 0 ? (
        <p className="text-small text-muted">{labels.noSlots}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {slots.map((slot) => {
            const past = new Date(slot.start_at).getTime() < nowMs;
            return (
              <li
                key={slot.id}
                className="border-hairline rounded-base flex items-center justify-between gap-3 border px-3 py-2"
              >
                <div className="flex flex-col gap-0.5">
                  <span
                    className={`text-small ${past ? "text-muted line-through" : "text-foreground"}`}
                  >
                    {formatSlotDateTime(slot.start_at)}
                  </span>
                  <span className="text-caption text-muted">
                    {labels.booked
                      .replace("{booked}", String(slot.booked_count))
                      .replace("{capacity}", String(slot.capacity))}
                    {slot.status !== "open" ? ` · ${slot.status}` : ""}
                  </span>
                </div>
                <DeleteSlotButton
                  experienceId={experienceId}
                  slot={slot}
                  labels={labels}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
