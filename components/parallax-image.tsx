"use client";

import { useEffect, useRef } from "react";

/*
  Subtle scroll parallax for the detail hero. Perf-conscious for low-end Android
  (CLAUDE.md §4.6): a single passive scroll listener, rAF-throttled, early-outs
  when the hero is off-screen, capped at ±64px, and fully disabled under
  prefers-reduced-motion. The image stays oversized (120%) so the translate never
  reveals an edge. Ken-Burns drift lives on the inner <img>; parallax translates
  the wrapper, so the two transforms never fight.
*/
export function ParallaxImage({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return; // off-screen
      const offset = Math.max(0, Math.min(64, window.scrollY * 0.25));
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="absolute inset-0 -z-10 will-change-transform">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        fetchPriority="high"
        className="animate-kenburns h-[120%] w-full object-cover"
      />
    </div>
  );
}
