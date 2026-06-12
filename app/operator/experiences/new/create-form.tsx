"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { Select } from "@/components/ui/select";
import { CATEGORIES, COUNTIES } from "@/lib/catalog";
import { createExperience, type FormState } from "../actions";

export type CreateExperienceLabels = {
  title: string;
  titlePh: string;
  category: string;
  catPh: string;
  county: string;
  countyPh: string;
  price: string;
  pricePh: string;
  priceHint: string;
  creating: string;
  createDraft: string;
};

function SubmitButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth disabled={pending} aria-busy={pending}>
      {pending ? busy : idle}
    </Button>
  );
}

export function CreateExperienceForm({
  labels,
}: {
  labels: CreateExperienceLabels;
}) {
  const [state, action] = useActionState<FormState, FormData>(createExperience, {
    status: "idle",
  });

  return (
    <form action={action} className="flex flex-col gap-5">
      <TextField
        label={labels.title}
        name="title"
        autoFocus
        placeholder={labels.titlePh}
        error={state.status === "error" ? state.message : undefined}
      />
      <Select
        label={labels.category}
        name="category"
        placeholder={labels.catPh}
        defaultValue=""
        options={CATEGORIES}
      />
      <Select
        label={labels.county}
        name="county"
        placeholder={labels.countyPh}
        defaultValue=""
        options={COUNTIES}
      />
      <TextField
        label={labels.price}
        name="base_price_kes"
        type="text"
        inputMode="numeric"
        placeholder={labels.pricePh}
        hint={labels.priceHint}
      />
      <SubmitButton idle={labels.createDraft} busy={labels.creating} />
    </form>
  );
}
