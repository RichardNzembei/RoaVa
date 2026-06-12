"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { updateName, type NameState } from "./actions";

function SaveButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending} aria-busy={pending}>
      {pending ? busy : idle}
    </Button>
  );
}

export function AccountNameForm({
  currentName,
  labels,
}: {
  currentName: string;
  labels: { nameLabel: string; save: string; saving: string; saved: string };
}) {
  const [state, action] = useActionState<NameState, FormData>(updateName, {
    status: "idle",
  });

  return (
    <form action={action} className="flex items-end gap-3">
      <div className="flex-1">
        <TextField
          label={labels.nameLabel}
          name="name"
          defaultValue={currentName}
          error={state.status === "error" ? state.message : undefined}
        />
      </div>
      <SaveButton idle={labels.save} busy={labels.saving} />
      {state.status === "saved" ? (
        <span className="text-caption text-success pb-3" aria-live="polite">
          {labels.saved}
        </span>
      ) : null}
    </form>
  );
}
