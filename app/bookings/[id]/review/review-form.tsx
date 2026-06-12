"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress";
import {
  REVIEW_IMAGES_BUCKET,
  reviewImageUrl,
  reviewImagePath,
} from "@/lib/storage";
import { submitReview, type ReviewState } from "./actions";

const MAX_PHOTOS = 4;

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
  profileId,
}: {
  bookingId: string;
  experienceId: string;
  profileId: string;
}) {
  const action = submitReview.bind(null, bookingId, experienceId);
  const [state, formAction] = useActionState<ReviewState, FormData>(action, {
    status: "idle",
  });
  const [rating, setRating] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const supabase = createClient();
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (photos.length >= MAX_PHOTOS) break;
        const blob = await compressImage(file);
        const key = reviewImagePath(
          profileId,
          bookingId,
          `${crypto.randomUUID()}.webp`,
        );
        const { error } = await supabase.storage
          .from(REVIEW_IMAGES_BUCKET)
          .upload(key, blob, { contentType: "image/webp", upsert: false });
        if (!error) setPhotos((p) => [...p, key]);
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="rating" value={rating} />
      <input type="hidden" name="photos" value={JSON.stringify(photos)} />

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

      <div className="flex flex-col gap-2">
        <span className="text-small text-foreground">Photos (optional)</span>
        {photos.length > 0 ? (
          <ul className="grid grid-cols-4 gap-2">
            {photos.map((key) => (
              <li
                key={key}
                className="bg-accent-soft aspect-square overflow-hidden rounded-base"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reviewImageUrl(key)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </li>
            ))}
          </ul>
        ) : null}
        {photos.length < MAX_PHOTOS ? (
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => onFiles(e.target.files)}
            disabled={busy}
            className="text-small text-foreground file:border-hairline file:bg-surface file:text-foreground file:mr-3 file:min-h-12 file:rounded-base file:border file:px-4 file:text-small"
          />
        ) : null}
        {busy ? (
          <span className="text-caption text-muted" aria-live="polite">
            Uploading…
          </span>
        ) : null}
      </div>

      {state.status === "error" ? (
        <p className="text-caption text-danger" aria-live="polite">
          {state.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
