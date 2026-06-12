"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { payWithMpesa, type CheckoutState } from "./actions";

function PayButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth disabled={pending} aria-busy={pending}>
      {pending ? "Sending prompt…" : "Pay with M-Pesa"}
    </Button>
  );
}

export function CheckoutForm({
  experienceId,
  slotId,
  party,
  defaultPhone,
}: {
  experienceId: string;
  slotId: string;
  party: number;
  defaultPhone: string;
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
        label="M-Pesa number"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        defaultValue={defaultPhone}
        placeholder="0712 345 678"
        hint="We'll send a prompt to this number — enter your M-Pesa PIN to confirm."
        error={state.status === "error" ? state.message : undefined}
      />
      <PayButton />
      <p className="text-caption text-muted text-center">
        You only pay once you approve the prompt on your phone.
      </p>
    </form>
  );
}
