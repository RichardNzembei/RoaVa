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

function PublishButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Publishing…" : "Publish"}
    </Button>
  );
}

export function PublishControls({
  experienceId,
  status,
}: {
  experienceId: string;
  status: string;
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
            This experience is live and bookable.
          </span>
          <form action={unpublishExperience.bind(null, experienceId)}>
            <Button type="submit" variant="secondary">
              Unpublish
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-small text-foreground flex-1">
              Draft — only you can see this.
            </span>
            <form action={formAction}>
              <PublishButton />
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
              Delete this experience for good?
            </span>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-small text-muted"
            >
              Keep
            </button>
            <form action={deleteExperience.bind(null, experienceId)}>
              <Button type="submit" variant="danger">
                Delete
              </Button>
            </form>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-small text-muted active:text-danger"
          >
            Delete experience
          </button>
        )}
      </div>
    </div>
  );
}
