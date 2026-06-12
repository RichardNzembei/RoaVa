"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { formatSlotDateTime } from "@/lib/format";
import { addSlots, deleteSlot, type SlotFormState } from "../slot-actions";
import type { Database } from "@/lib/database.types";

type Slot = Database["public"]["Tables"]["availability_slots"]["Row"];

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Adding…" : "Add slot"}
    </Button>
  );
}

function DeleteSlotButton({
  experienceId,
  slot,
}: {
  experienceId: string;
  slot: Slot;
}) {
  const action = deleteSlot.bind(null, experienceId, slot.id);
  const label = slot.booked_count > 0 ? "Close" : "Remove";
  return (
    <form action={action}>
      <button
        type="submit"
        className="text-caption text-muted active:text-danger"
        aria-label={`${label} slot ${formatSlotDateTime(slot.start_at)}`}
      >
        {label}
      </button>
    </form>
  );
}

export function SlotManager({
  experienceId,
  slots,
}: {
  experienceId: string;
  slots: Slot[];
}) {
  const action = addSlots.bind(null, experienceId);
  const [state, formAction] = useActionState<SlotFormState, FormData>(action, {
    status: "idle",
  });

  return (
    <div className="flex flex-col gap-5">
      <form
        action={formAction}
        className="border-hairline rounded-card bg-surface flex flex-col gap-4 border p-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Date" name="date" type="date" />
          <TextField label="Time" name="time" type="time" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Capacity"
            name="capacity"
            inputMode="numeric"
            defaultValue="10"
          />
          <TextField
            label="Repeat weekly (weeks)"
            name="repeat_weeks"
            inputMode="numeric"
            defaultValue="1"
            hint="1 = just this date."
          />
        </div>
        <TextField
          label="Price override (KES, optional)"
          name="price_override"
          inputMode="numeric"
          placeholder="Leave blank to use the base price"
        />
        <div className="flex items-center gap-3">
          <AddButton />
          {state.status === "error" ? (
            <span className="text-caption text-danger" aria-live="polite">
              {state.message}
            </span>
          ) : state.status === "success" ? (
            <span className="text-caption text-success" aria-live="polite">
              Added {state.added} slot{state.added > 1 ? "s" : ""}.
            </span>
          ) : null}
        </div>
      </form>

      {slots.length === 0 ? (
        <p className="text-small text-muted">
          No time slots yet. Add at least one upcoming slot to publish.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {slots.map((slot) => {
            const past = new Date(slot.start_at).getTime() < Date.now();
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
                    {slot.booked_count}/{slot.capacity} booked
                    {slot.status !== "open" ? ` · ${slot.status}` : ""}
                  </span>
                </div>
                <DeleteSlotButton experienceId={experienceId} slot={slot} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
