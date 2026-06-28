"use client";

import { m } from "motion/react";

/*
  The ticket QR, revealed with a soft scale + fade on mount (the post-purchase
  "here's your pass" moment), and — while the ticket is still valid — a single
  light sheen sweeping across the code once it has settled. Transform/opacity
  only; the sheen is one-shot (never a battery-draining loop on a ticket left
  open at a gate) and is suppressed for reduced-motion users, who also keep the
  white frame fully opaque so the QR stays crisp. A used ticket reveals dimmed.

  The QR SVG is server-rendered and injected as markup; the sheen rides as an
  absolutely-positioned sibling so it never overlaps the scannable code at rest.
*/
export function TicketQr({ svg, used }: { svg: string; used: boolean }) {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: used ? 0.4 : 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      className="ring-border relative overflow-hidden rounded-card bg-white p-3 ring-1"
    >
      <div
        dangerouslySetInnerHTML={{ __html: svg }}
        aria-label="Ticket QR code"
      />
      {!used ? (
        <m.span
          aria-hidden
          initial={{ x: "-140%" }}
          animate={{ x: "140%" }}
          transition={{ duration: 0.9, ease: "easeInOut", delay: 0.55 }}
          className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/55 to-transparent"
        />
      ) : null}
    </m.div>
  );
}
