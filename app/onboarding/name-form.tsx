"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { saveName, type NameState } from "./actions";

function SubmitButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth disabled={pending} aria-busy={pending}>
      {pending ? busy : idle}
    </Button>
  );
}

export function NameForm({
  next,
  labels,
}: {
  next?: string;
  labels: { nameLabel: string; continue: string; saving: string };
}) {
  const [state, action] = useActionState<NameState, FormData>(saveName, {
    status: "idle",
  });

  return (
    <form action={action} className="flex flex-col gap-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <TextField
        label={labels.nameLabel}
        name="name"
        type="text"
        autoComplete="name"
        autoFocus
        placeholder="e.g. Amani"
        error={state.status === "error" ? state.message : undefined}
      />
      <SubmitButton idle={labels.continue} busy={labels.saving} />
    </form>
  );
}
