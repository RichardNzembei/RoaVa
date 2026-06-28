"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

/*
  Scroll-reactive shell for the (server-rendered) header. Once the page scrolls
  past a few pixels the bar condenses (56→48px) and lifts onto a soft shadow,
  so it reads as "floating chrome" over content without ever leaving its glass.
  Pure CSS transitions on height/shadow (no Motion runtime — this is always
  mounted, so we keep it cheap), on the house ease, and the global
  reduced-motion rule flattens the transition for those users. The scroll
  listener is passive to stay off the main-thread budget (§6).
*/
export function HeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`glass border-hairline ease-out-soft sticky top-0 z-10 border-b transition-shadow duration-300 ${
        scrolled ? "shadow-card" : ""
      }`}
    >
      <div
        className={`ease-out-soft mx-auto flex w-full max-w-2xl items-center justify-between px-5 transition-[height] duration-300 ${
          scrolled ? "h-12" : "h-14"
        }`}
      >
        {children}
      </div>
    </header>
  );
}
