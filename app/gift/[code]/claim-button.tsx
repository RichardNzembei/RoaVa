"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { claimGiftAction, type ClaimState } from "./actions";

export type ClaimLabels = {
  claim: string;
  claiming: string;
  errAlreadyClaimed: string;
  errNotReady: string;
  errInvalid: string;
  errGeneric: string;
};

function SubmitButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth disabled={pending} aria-busy={pending}>
      {pending ? busy : idle}
    </Button>
  );
}

export function ClaimButton({
  code,
  labels,
}: {
  code: string;
  labels: ClaimLabels;
}) {
  const action = claimGiftAction.bind(null, code);
  const [state, formAction] = useActionState<ClaimState, FormData>(action, {
    status: "idle",
  });

  const errorText =
    state.status === "error"
      ? state.reason === "already_claimed"
        ? labels.errAlreadyClaimed
        : state.reason === "not_ready"
          ? labels.errNotReady
          : state.reason === "invalid"
            ? labels.errInvalid
            : labels.errGeneric
      : null;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <SubmitButton idle={labels.claim} busy={labels.claiming} />
      {errorText ? (
        <p role="alert" className="text-small text-danger text-center">
          {errorText}
        </p>
      ) : null}
    </form>
  );
}
