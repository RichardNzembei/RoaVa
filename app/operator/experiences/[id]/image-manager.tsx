"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  EXPERIENCE_IMAGES_BUCKET,
  experienceImageUrl,
  experienceImagePath,
} from "@/lib/storage";
import { attachImage, removeImage } from "../image-actions";

const MAX_DIM = 1600; // longest edge — plenty for mobile, keeps files small
const QUALITY = 0.8;

// Resize + recompress in the browser so we respect the user's airtime and the
// 5 MB bucket limit (data-light, performance budget).
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", QUALITY),
  );
  return blob ?? file;
}

export function ImageManager({
  experienceId,
  operatorId,
  images,
}: {
  experienceId: string;
  operatorId: string;
  images: string[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);
    const supabase = createClient();

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const blob = await compress(file);
        const key = experienceImagePath(
          operatorId,
          experienceId,
          `${crypto.randomUUID()}.webp`,
        );
        const { error: upErr } = await supabase.storage
          .from(EXPERIENCE_IMAGES_BUCKET)
          .upload(key, blob, { contentType: "image/webp", upsert: false });
        if (upErr) {
          setError("Upload failed. Check your connection and try again.");
          break;
        }
        const res = await attachImage(experienceId, key);
        if (!res.ok) {
          setError(res.message ?? "Couldn't save the photo.");
          break;
        }
      }
      router.refresh();
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onRemove(key: string) {
    setBusy(true);
    try {
      await removeImage(experienceId, key);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((key, i) => (
            <li key={key} className="relative">
              <div className="bg-accent-soft aspect-[4/3] overflow-hidden rounded-base">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={experienceImageUrl(key)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              {i === 0 ? (
                <span className="bg-ink/70 text-caption absolute left-1.5 top-1.5 rounded-base px-1.5 py-0.5 text-white">
                  Cover
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => onRemove(key)}
                disabled={busy}
                aria-label="Remove photo"
                className="bg-ink/70 absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full text-white disabled:opacity-50"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="border-hairline text-muted rounded-card flex aspect-[4/3] max-w-xs flex-col items-center justify-center gap-1 border border-dashed">
          <span className="text-small">No photos yet</span>
          <span className="text-caption">Add a sunlit, people-present shot</span>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => onFiles(e.target.files)}
          disabled={busy}
          className="text-small text-foreground file:border-hairline file:bg-surface file:text-foreground file:mr-3 file:min-h-12 file:rounded-base file:border file:px-4 file:text-small"
        />
        {busy ? (
          <span className="text-caption text-muted" aria-live="polite">
            Uploading…
          </span>
        ) : error ? (
          <span className="text-caption text-danger" aria-live="polite">
            {error}
          </span>
        ) : null}
      </div>
    </div>
  );
}
