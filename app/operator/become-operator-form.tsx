"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { becomeOperator, type BecomeOperatorState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth disabled={pending} aria-busy={pending}>
      {pending ? "Setting up…" : "Start listing"}
    </Button>
  );
}

export function BecomeOperatorForm() {
  const [state, action] = useActionState<BecomeOperatorState, FormData>(
    becomeOperator,
    { status: "idle" },
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <TextField
        label="Business name"
        name="business_name"
        type="text"
        autoFocus
        placeholder="e.g. Rift Valley Treks"
        hint="This is what guests will see on your listings."
        error={state.status === "error" ? state.message : undefined}
      />
      <SubmitButton />
    </form>
  );
}
