"use client";

import { useState } from "react";

// An <img> that degrades to a tasteful letter-placeholder if the source fails
// to load — never a broken frame or stray alt text (design spec §7 imagery).
// Use for experience imagery where a missing/410'd storage object is possible.
export function ExperienceImage({
  src,
  alt = "",
  fallbackChar,
  className,
  loading,
}: {
  src: string;
  alt?: string;
  fallbackChar: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="bg-accent-soft text-sunset text-display flex h-full w-full items-center justify-center">
        {fallbackChar}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
