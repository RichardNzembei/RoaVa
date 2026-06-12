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

export type EditExperienceLabels = {
  title: string;
  desc: string;
  descPh: string;
  category: string;
  county: string;
  choose: string;
  area: string;
  areaPh: string;
  meeting: string;
  meetingPh: string;
  meetingHint: string;
  price: string;
  duration: string;
  durationPh: string;
  maxParty: string;
  cancel: string;
  cancelPh: string;
  cancelHint: string;
  saving: string;
  save: string;
  savedInstant: string;
};

function SubmitButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? busy : idle}
    </Button>
  );
}

export function EditExperienceForm({
  experience,
  labels,
}: {
  experience: Experience;
  labels: EditExperienceLabels;
}) {
  const action = updateExperience.bind(null, experience.id);
  const [state, formAction] = useActionState<FormState, FormData>(action, {
    status: "idle",
  });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <TextField
        label={labels.title}
        name="title"
        defaultValue={experience.title}
        error={state.status === "error" ? state.message : undefined}
      />
      <Textarea
        label={labels.desc}
        name="description"
        defaultValue={experience.description ?? ""}
        placeholder={labels.descPh}
      />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label={labels.category}
          name="category"
          options={CATEGORIES}
          defaultValue={experience.category ?? ""}
          placeholder={labels.choose}
        />
        <Select
          label={labels.county}
          name="county"
          options={COUNTIES}
          defaultValue={experience.county ?? ""}
          placeholder={labels.choose}
        />
      </div>
      <TextField
        label={labels.area}
        name="area"
        defaultValue={experience.area ?? ""}
        placeholder={labels.areaPh}
      />
      <Textarea
        label={labels.meeting}
        name="meeting_point"
        defaultValue={experience.meeting_point ?? ""}
        placeholder={labels.meetingPh}
        hint={labels.meetingHint}
      />
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label={labels.price}
          name="base_price_kes"
          inputMode="numeric"
          defaultValue={String(experience.base_price_kes)}
        />
        <TextField
          label={labels.duration}
          name="duration_minutes"
          inputMode="numeric"
          defaultValue={
            experience.duration_minutes
              ? String(experience.duration_minutes)
              : ""
          }
          placeholder={labels.durationPh}
        />
      </div>
      <TextField
        label={labels.maxParty}
        name="max_party_size"
        inputMode="numeric"
        defaultValue={String(experience.max_party_size)}
      />
      <Textarea
        label={labels.cancel}
        name="cancellation_policy"
        defaultValue={experience.cancellation_policy ?? ""}
        placeholder={labels.cancelPh}
        hint={labels.cancelHint}
      />

      <div className="flex items-center gap-3">
        <SubmitButton idle={labels.save} busy={labels.saving} />
        {state.status === "idle" ? (
          <span className="text-caption text-muted" aria-live="polite">
            {labels.savedInstant}
          </span>
        ) : null}
      </div>
    </form>
  );
}
