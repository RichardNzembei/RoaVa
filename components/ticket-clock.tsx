"use client";

import { useEffect, useState } from "react";

// A ticking live clock on a valid ticket — a moving element makes a screenshot
// of the ticket obviously stale to a gate attendant (anti-resale cue, §trust).
export function TicketClock() {
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString("en-KE", {
          timeZone: "Africa/Nairobi",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="text-caption text-savanna tabular-nums" aria-live="off">
      ● Live {now}
    </span>
  );
}
