"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleWishlist } from "./wishlist-actions";

export type WishlistLabels = {
  saved: string;
  save: string;
  removeAria: string;
  saveAria: string;
};

export function WishlistButton({
  experienceId,
  initialSaved,
  labels,
}: {
  experienceId: string;
  initialSaved: boolean;
  labels: WishlistLabels;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const prev = saved;
      setSaved(!prev); // optimistic
      const res = await toggleWishlist(experienceId);
      if ("auth" in res) {
        router.push(`/sign-in?next=/experiences/${experienceId}`);
        return;
      }
      setSaved(res.saved);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? labels.removeAria : labels.saveAria}
      className="border-hairline text-small text-foreground inline-flex min-h-12 items-center gap-2 rounded-base border px-4 disabled:opacity-60"
    >
      <span aria-hidden className={saved ? "text-sunset" : "text-muted"}>
        {saved ? "♥" : "♡"}
      </span>
      {saved ? labels.saved : labels.save}
    </button>
  );
}
