"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  publishExperience,
  unpublishExperience,
  deleteExperience,
  type FormState,
} from "../actions";

export type PublishLabels = {
  publishing: string;
  publish: string;
  liveMsg: string;
  unpublish: string;
  draftMsg: string;
  deleteConfirm: string;
  keep: string;
  del: string;
  deleteExp: string;
};

function PublishButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? busy : idle}
    </Button>
  );
}

export function PublishControls({
  experienceId,
  status,
  labels,
}: {
  experienceId: string;
  status: string;
  labels: PublishLabels;
}) {
  const publishAction = publishExperience.bind(null, experienceId);
  const [state, formAction] = useActionState<FormState, FormData>(
    publishAction,
    { status: "idle" },
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const published = status === "published";

  return (
    <div className="border-hairline rounded-card bg-surface flex flex-col gap-3 border p-4">
      {published ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-small text-foreground flex-1">
            {labels.liveMsg}
          </span>
          <form action={unpublishExperience.bind(null, experienceId)}>
            <Button type="submit" variant="secondary">
              {labels.unpublish}
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-small text-foreground flex-1">
              {labels.draftMsg}
            </span>
            <form action={formAction}>
              <PublishButton idle={labels.publish} busy={labels.publishing} />
            </form>
          </div>
          {state.status === "error" ? (
            <p className="text-caption text-danger" aria-live="polite">
              {state.message}
            </p>
          ) : null}
        </div>
      )}

      <div className="border-hairline border-t pt-3">
        {confirmDelete ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-small text-foreground flex-1">
              {labels.deleteConfirm}
            </span>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-small text-muted"
            >
              {labels.keep}
            </button>
            <form action={deleteExperience.bind(null, experienceId)}>
              <Button type="submit" variant="danger">
                {labels.del}
              </Button>
            </form>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-small text-muted active:text-danger"
          >
            {labels.deleteExp}
          </button>
        )}
      </div>
    </div>
  );
}
