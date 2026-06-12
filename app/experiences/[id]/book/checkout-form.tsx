"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { payWithMpesa, type CheckoutState } from "./actions";

export type CheckoutLabels = {
  mpesaLabel: string;
  mpesaHint: string;
  pay: string;
  paying: string;
  payNote: string;
};

function PayButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth disabled={pending} aria-busy={pending}>
      {pending ? busy : idle}
    </Button>
  );
}

export function CheckoutForm({
  experienceId,
  slotId,
  party,
  defaultPhone,
  labels,
}: {
  experienceId: string;
  slotId: string;
  party: number;
  defaultPhone: string;
  labels: CheckoutLabels;
}) {
  const action = payWithMpesa.bind(null, experienceId);
  const [state, formAction] = useActionState<CheckoutState, FormData>(action, {
    status: "idle",
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="slot" value={slotId} />
      <input type="hidden" name="party" value={party} />
      <TextField
        label={labels.mpesaLabel}
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        defaultValue={defaultPhone}
        placeholder="0712 345 678"
        hint={labels.mpesaHint}
        error={state.status === "error" ? state.message : undefined}
      />
      <PayButton idle={labels.pay} busy={labels.paying} />
      <p className="text-caption text-muted text-center">{labels.payNote}</p>
    </form>
  );
}
