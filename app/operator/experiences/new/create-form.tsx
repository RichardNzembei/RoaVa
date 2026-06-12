"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { Select } from "@/components/ui/select";
import { CATEGORIES, COUNTIES } from "@/lib/catalog";
import { createExperience, type FormState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth disabled={pending} aria-busy={pending}>
      {pending ? "Creating…" : "Create draft"}
    </Button>
  );
}

export function CreateExperienceForm() {
  const [state, action] = useActionState<FormState, FormData>(createExperience, {
    status: "idle",
  });

  return (
    <form action={action} className="flex flex-col gap-5">
      <TextField
        label="Title"
        name="title"
        autoFocus
        placeholder="e.g. Sunrise hike up Ngong Hills"
        error={state.status === "error" ? state.message : undefined}
      />
      <Select
        label="Category"
        name="category"
        placeholder="Choose a category"
        defaultValue=""
        options={CATEGORIES}
      />
      <Select
        label="County"
        name="county"
        placeholder="Choose a county"
        defaultValue=""
        options={COUNTIES}
      />
      <TextField
        label="Price per person (KES)"
        name="base_price_kes"
        type="text"
        inputMode="numeric"
        placeholder="e.g. 3500"
        hint="You can fine-tune everything else next."
      />
      <SubmitButton />
    </form>
  );
}
