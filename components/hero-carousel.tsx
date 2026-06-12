"use client";

import { useEffect, useRef, useState } from "react";

/*
  Crossfading, Ken-Burns hero backdrop. "More animated" but perf- and
  data-conscious: images only, the active one drifts (transform) while the next
  fades in (opacity). Auto-stills on prefers-reduced-motion or Save-Data — those
  users see a single static photo, no cycling.

  An optional video (videoSrc) layers on top ONLY for users on a fast connection
  with motion allowed; it sits over the always-present image, so a slow or
  data-saving device never pays for it.
*/
const INTERVAL_MS = 6000;

export function HeroCarousel({
  images,
  videoSrc,
}: {
  images: string[];
  videoSrc?: string;
}) {
  const [index, setIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // @ts-expect-error - connection is non-standard but widely available on mobile
    const conn = navigator.connection;
    const saveData = Boolean(conn?.saveData);
    const fast = !conn || conn.effectiveType === "4g";
    reduced.current = mq.matches;

    if (mq.matches || saveData) return; // static image, no motion

    const t = setInterval(
      () => setIndex((i) => (i + 1) % images.length),
      INTERVAL_MS,
    );

    // Only enhance with video on a fast, non-data-saving, motion-OK connection.
    if (videoSrc && fast && !saveData) setShowVideo(true);

    return () => clearInterval(t);
  }, [images.length, videoSrc]);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          loading={i === 0 ? "eager" : "lazy"}
          fetchPriority={i === 0 ? "high" : "low"}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            i === index ? "animate-kenburns opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {showVideo && videoSrc ? (
        <video
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-1000 data-[ready=true]:opacity-100"
          onCanPlay={(e) => e.currentTarget.setAttribute("data-ready", "true")}
        />
      ) : null}
    </div>
  );
}
