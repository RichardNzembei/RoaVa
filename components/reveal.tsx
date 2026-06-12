"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/*
  Editorial scroll-reveal: content rises + fades in as it enters the viewport
  (signature motion of the immersive layout). Used for below-the-fold sections,
  so the opacity-0 start never hides critical/above-fold content. Reduced-motion
  users (and the no-IO fallback) see it immediately, no transform.
*/
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      // @ts-expect-error polymorphic ref across the small tag union
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
      className={`ease-out-soft transition-[opacity,transform] duration-700 motion-reduce:!translate-y-0 motion-reduce:!opacity-100 ${
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
