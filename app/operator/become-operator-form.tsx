"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { becomeOperator, type BecomeOperatorState } from "./actions";

export type BecomeOperatorLabels = {
  bizName: string;
  bizPh: string;
  bizHint: string;
  setup: string;
  start: string;
};

function SubmitButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth disabled={pending} aria-busy={pending}>
      {pending ? busy : idle}
    </Button>
  );
}

export function BecomeOperatorForm({ labels }: { labels: BecomeOperatorLabels }) {
  const [state, action] = useActionState<BecomeOperatorState, FormData>(
    becomeOperator,
    { status: "idle" },
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <TextField
        label={labels.bizName}
        name="business_name"
        type="text"
        autoFocus
        placeholder={labels.bizPh}
        hint={labels.bizHint}
        error={state.status === "error" ? state.message : undefined}
      />
      <SubmitButton idle={labels.start} busy={labels.setup} />
    </form>
  );
}
