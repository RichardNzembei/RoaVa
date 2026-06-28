"use client";

import { m } from "motion/react";
import type { ReactNode } from "react";

/*
  Route-change transition. A template (unlike a layout) re-mounts on every
  navigation, so this gentle rise + fade plays as the user moves between pages —
  the App-Router equivalent of a view transition (Next does client-side nav, so
  the MPA @view-transition rule wouldn't fire). Transform/opacity only, ~220ms
  on the house ease (§7). MotionConfig reducedMotion="user" drops the translate
  for reduced-motion users, leaving a plain opacity fade.

  Renders a flow-through flex column so page <main> elements keep their flex-1
  stretch inside the wrapper.
*/
export default function Template({ children }: { children: ReactNode }) {
  return (
    <m.div
      className="flex flex-1 flex-col"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}
