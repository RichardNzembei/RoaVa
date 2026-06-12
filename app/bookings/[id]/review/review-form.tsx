"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitReview, type ReviewState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth disabled={pending} aria-busy={pending}>
      {pending ? "Posting…" : "Post review"}
    </Button>
  );
}

export function ReviewForm({
  bookingId,
  experienceId,
}: {
  bookingId: string;
  experienceId: string;
}) {
  const action = submitReview.bind(null, bookingId, experienceId);
  const [state, formAction] = useActionState<ReviewState, FormData>(action, {
    status: "idle",
  });
  const [rating, setRating] = useState(0);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="rating" value={rating} />
      <div className="flex flex-col gap-2">
        <span className="text-small text-foreground">Your rating</span>
        <div className="flex gap-2" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              onClick={() => setRating(n)}
              className={`text-h1 leading-none ${n <= rating ? "text-warning" : "text-muted"}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <Textarea
        label="Your review"
        name="body"
        placeholder="How was it? What should other guests know?"
        rows={5}
      />

      {state.status === "error" ? (
        <p className="text-caption text-danger" aria-live="polite">
          {state.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
