"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { CATEGORIES, COUNTIES } from "@/lib/catalog";
import { updateExperience, type FormState } from "../actions";
import type { Database } from "@/lib/database.types";

type Experience = Database["public"]["Tables"]["experiences"]["Row"];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

export function EditExperienceForm({ experience }: { experience: Experience }) {
  const action = updateExperience.bind(null, experience.id);
  const [state, formAction] = useActionState<FormState, FormData>(action, {
    status: "idle",
  });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <TextField
        label="Title"
        name="title"
        defaultValue={experience.title}
        error={state.status === "error" ? state.message : undefined}
      />
      <Textarea
        label="Description"
        name="description"
        defaultValue={experience.description ?? ""}
        placeholder="What makes this worth doing? What's included?"
      />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Category"
          name="category"
          options={CATEGORIES}
          defaultValue={experience.category ?? ""}
          placeholder="Choose"
        />
        <Select
          label="County"
          name="county"
          options={COUNTIES}
          defaultValue={experience.county ?? ""}
          placeholder="Choose"
        />
      </div>
      <TextField
        label="Area / neighbourhood"
        name="area"
        defaultValue={experience.area ?? ""}
        placeholder="e.g. Karen"
      />
      <Textarea
        label="Meeting point"
        name="meeting_point"
        defaultValue={experience.meeting_point ?? ""}
        placeholder="Where exactly should guests meet you?"
        hint="Required before publishing."
      />
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Price per person (KES)"
          name="base_price_kes"
          inputMode="numeric"
          defaultValue={String(experience.base_price_kes)}
        />
        <TextField
          label="Duration (minutes)"
          name="duration_minutes"
          inputMode="numeric"
          defaultValue={
            experience.duration_minutes
              ? String(experience.duration_minutes)
              : ""
          }
          placeholder="e.g. 180"
        />
      </div>
      <TextField
        label="Max party size per booking"
        name="max_party_size"
        inputMode="numeric"
        defaultValue={String(experience.max_party_size)}
      />
      <Textarea
        label="Cancellation policy"
        name="cancellation_policy"
        defaultValue={experience.cancellation_policy ?? ""}
        placeholder="e.g. Free cancellation up to 24 hours before."
        hint="Shown to guests before they pay."
      />

      <div className="flex items-center gap-3">
        <SubmitButton />
        {state.status === "idle" ? (
          <span className="text-caption text-muted" aria-live="polite">
            Saved changes appear instantly.
          </span>
        ) : null}
      </div>
    </form>
  );
}
