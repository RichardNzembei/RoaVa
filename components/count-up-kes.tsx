"use client";

import { useEffect } from "react";
import {
  animate,
  m,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { formatKes } from "@/lib/format";

/*
  A KES amount that tweens to its new value when it changes (e.g. as party size
  changes the booking total). Spring-free, ~360ms on the house ease, and it
  formats via the shared formatKes so the currency stays explicit (§8). The
  first render shows the value outright — only subsequent changes count. Snaps
  instantly for reduced-motion users.
*/
export function CountUpKes({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => formatKes(Math.round(v)));

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      duration: 0.36,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [value, reduce, mv]);

  return <m.span>{text}</m.span>;
}
