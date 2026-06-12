"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { formatKenyanPhone } from "@/lib/phone";
import { savePayoutNumber, type PayoutNumberState } from "./actions";

export type PayoutNumberLabels = {
  title: string;
  set: string; // "Payouts go to {phone}."
  unset: string;
  label: string;
  saving: string;
  update: string;
  save: string;
  saved: string;
};

function SaveButton({
  hasNumber,
  saving,
  update,
  save,
}: {
  hasNumber: boolean;
  saving: string;
  update: string;
  save: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending} aria-busy={pending}>
      {pending ? saving : hasNumber ? update : save}
    </Button>
  );
}

export function PayoutNumberForm({
  current,
  labels,
}: {
  current: string | null;
  labels: PayoutNumberLabels;
}) {
  const [state, action] = useActionState<PayoutNumberState, FormData>(
    savePayoutNumber,
    { status: "idle" },
  );

  return (
    <div
      className={`rounded-card flex flex-col gap-3 border p-4 ${
        current ? "border-hairline bg-surface" : "bg-accent-soft border-sunset border"
      }`}
    >
      <div className="flex flex-col gap-0.5">
        <h2 className="text-h3 text-foreground">{labels.title}</h2>
        <p className="text-small text-muted">
          {current
            ? labels.set.replace("{phone}", formatKenyanPhone(current))
            : labels.unset}
        </p>
      </div>
      <form action={action} className="flex items-end gap-3">
        <div className="flex-1">
          <TextField
            label={labels.label}
            name="payout_msisdn"
            type="tel"
            inputMode="tel"
            defaultValue={current ?? ""}
            placeholder="0712 345 678"
            error={state.status === "error" ? state.message : undefined}
          />
        </div>
        <SaveButton
          hasNumber={Boolean(current)}
          saving={labels.saving}
          update={labels.update}
          save={labels.save}
        />
      </form>
      {state.status === "saved" ? (
        <p className="text-caption text-success" aria-live="polite">
          {labels.saved}
        </p>
      ) : null}
    </div>
  );
}
