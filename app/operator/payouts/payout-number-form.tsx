"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { formatKenyanPhone } from "@/lib/phone";
import { savePayoutNumber, type PayoutNumberState } from "./actions";

function SaveButton({ hasNumber }: { hasNumber: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending} aria-busy={pending}>
      {pending ? "Saving…" : hasNumber ? "Update" : "Save"}
    </Button>
  );
}

export function PayoutNumberForm({ current }: { current: string | null }) {
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
        <h2 className="text-h3 text-foreground">Payout number</h2>
        <p className="text-small text-muted">
          {current
            ? `Payouts go to ${formatKenyanPhone(current)}.`
            : "Add the M-Pesa number to receive your payouts — required to get paid."}
        </p>
      </div>
      <form action={action} className="flex items-end gap-3">
        <div className="flex-1">
          <TextField
            label="M-Pesa number"
            name="payout_msisdn"
            type="tel"
            inputMode="tel"
            defaultValue={current ?? ""}
            placeholder="0712 345 678"
            error={state.status === "error" ? state.message : undefined}
          />
        </div>
        <SaveButton hasNumber={Boolean(current)} />
      </form>
      {state.status === "saved" ? (
        <p className="text-caption text-success" aria-live="polite">
          Payout number saved.
        </p>
      ) : null}
    </div>
  );
}
