"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

// Loads the Motion engine lazily (see motion-features) and uses the tiny `m`
// component everywhere — `strict` makes the heavy `motion.*` import throw so we
// can't accidentally pull the full bundle. `reducedMotion="user"` wires every
// Motion animation to the OS setting (transforms drop, opacity stays), matching
// the global CSS reduced-motion rule in globals.css (§7).
const loadFeatures = () =>
  import("./motion-features").then((mod) => mod.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadFeatures} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
