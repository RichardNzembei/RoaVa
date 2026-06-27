"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { captureEvent } from "@/components/analytics";

type StatusResponse = {
  status: string;
  payment: string | null;
  failureReason: string | null;
  hasTicket: boolean;
};

const STK_WINDOW_S = 60; // the M-Pesa prompt window
const RETRY_COOLDOWN_S = 15;

type FailureCopy = { title: string; detail: string };
export type BookingStatusLabels = {
  confirmedTitle: string;
  confirmedBody: string; // "{title} … {date}"
  confirmedSms: string;
  viewTicket: string;
  pendingTitle: string;
  pendingBody: string; // "{amount} … {title}"
  waiting: string; // "… {n}s"
  still: string;
  tryAgain: string;
  tryIn: string; // "… {n}s"
  payManual: string;
  manualDetail: string; // "{paybill} … {ref} … {amount}"
  browseOther: string;
  guestOne: string;
  guestMany: string;
  failure: {
    insufficient: FailureCopy;
    pin: FailureCopy;
    cancel: FailureCopy;
    timeout: FailureCopy;
    network: FailureCopy;
    generic: FailureCopy;
  };
};

// Map the provider reason → a localised failure copy (§6.5).
function failureCopy(
  reason: string | null,
  f: BookingStatusLabels["failure"],
): FailureCopy {
  const r = (reason ?? "").toLowerCase();
  if (r.includes("insufficient") || r.includes("balance")) return f.insufficient;
  if (r.includes("pin")) return f.pin;
  if (r.includes("cancel")) return f.cancel;
  if (r.includes("timeout") || r.includes("timed out")) return f.timeout;
  if (r.includes("network") || r.includes("ussd")) return f.network;
  return f.generic;
}

export function BookingStatus({
  bookingId,
  initialStatus,
  title,
  dateLabel,
  party,
  amountLabel,
  retryHref,
  manualPaybill,
  labels,
}: {
  bookingId: string;
  initialStatus: string;
  title: string;
  dateLabel: string;
  party: number;
  amountLabel: string;
  retryHref: string;
  manualPaybill: string | null;
  labels: BookingStatusLabels;
}) {
  const [data, setData] = useState<StatusResponse>({
    status: initialStatus,
    payment: null,
    failureReason: null,
    hasTicket: false,
  });
  const [secondsLeft, setSecondsLeft] = useState(STK_WINDOW_S);
  const [cooldown, setCooldown] = useState(RETRY_COOLDOWN_S);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const settled = data.status === "confirmed" || data.status === "cancelled";

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        cache: "no-store",
      });
      if (res.ok) setData(await res.json());
    } catch {
      // transient — keep polling
    }
  }, [bookingId]);

  // Poll until settled.
  useEffect(() => {
    if (settled) {
      if (timer.current) clearInterval(timer.current);
      return;
    }
    // Kick off + schedule the status poll; state updates happen async after fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    poll();
    timer.current = setInterval(poll, 3000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [poll, settled]);

  // Analytics: fire the conversion outcome once it settles (no-op without a key).
  useEffect(() => {
    if (data.status === "confirmed") {
      captureEvent("booking_confirmed", { booking_id: bookingId });
    } else if (data.status === "cancelled") {
      captureEvent("booking_failed", {
        booking_id: bookingId,
        reason: data.failureReason ?? "unknown",
      });
    }
  }, [data.status, data.failureReason, bookingId]);

  // Countdown for the prompt window (display only).
  useEffect(() => {
    if (settled || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, settled]);

  // Retry cooldown once cancelled.
  useEffect(() => {
    if (data.status !== "cancelled" || cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [data.status, cooldown]);

  if (data.status === "confirmed") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span
            aria-hidden
            className="bg-success/30 motion-safe:animate-burst absolute inset-0 rounded-full"
          />
          <span className="bg-success/15 text-success text-display motion-safe:animate-pop relative flex h-20 w-20 items-center justify-center rounded-full">
            ✓
          </span>
        </div>
        <h1 className="text-display text-foreground motion-safe:animate-fade-up">
          {labels.confirmedTitle}
        </h1>
        <p className="text-body text-muted">
          {labels.confirmedBody
            .replace("{title}", title)
            .replace("{date}", dateLabel)}
        </p>
        <Summary
          party={party}
          amountLabel={amountLabel}
          guestOne={labels.guestOne}
          guestMany={labels.guestMany}
        />
        <p className="text-caption text-muted">{labels.confirmedSms}</p>
        <Link
          href={`/tickets/${bookingId}`}
          className={buttonClasses("primary", true)}
        >
          {labels.viewTicket}
        </Link>
      </div>
    );
  }

  if (data.status === "cancelled") {
    const copy = failureCopy(data.failureReason, labels.failure);
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="bg-danger/15 text-danger flex h-16 w-16 items-center justify-center rounded-full text-h1">
            !
          </div>
          <h1 className="text-h1 text-foreground">{copy.title}</h1>
          <p className="text-body text-muted">{copy.detail}</p>
        </div>

        {cooldown > 0 ? (
          <button
            disabled
            className={`${buttonClasses("primary", true)} pointer-events-none`}
          >
            {labels.tryIn.replace("{n}", String(cooldown))}
          </button>
        ) : (
          <Link href={retryHref} className={buttonClasses("primary", true)}>
            {labels.tryAgain}
          </Link>
        )}

        {manualPaybill ? (
          <div className="border-hairline rounded-card bg-surface flex flex-col gap-1 border p-4">
            <span className="text-small text-foreground">{labels.payManual}</span>
            <p className="text-caption text-muted">
              {labels.manualDetail
                .replace("{paybill}", manualPaybill)
                .replace("{ref}", bookingId.slice(0, 8))
                .replace("{amount}", amountLabel)}
            </p>
          </div>
        ) : null}

        <Link href="/experiences" className="text-small text-muted text-center">
          {labels.browseOther}
        </Link>
      </div>
    );
  }

  // Pending — the calm waiting state.
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="border-sunset h-16 w-16 animate-spin rounded-full border-4 border-t-transparent motion-reduce:animate-none" />
      <div className="flex flex-col gap-2">
        <h1 className="text-h1 text-foreground">{labels.pendingTitle}</h1>
        <p className="text-body text-muted">
          {labels.pendingBody
            .replace("{amount}", amountLabel)
            .replace("{title}", title)}
        </p>
      </div>
      <p className="text-small text-muted" aria-live="polite">
        {secondsLeft > 0
          ? labels.waiting.replace("{n}", String(secondsLeft))
          : labels.still}
      </p>
      <Summary
        party={party}
        amountLabel={amountLabel}
        guestOne={labels.guestOne}
        guestMany={labels.guestMany}
      />
    </div>
  );
}

function Summary({
  party,
  amountLabel,
  guestOne,
  guestMany,
}: {
  party: number;
  amountLabel: string;
  guestOne: string;
  guestMany: string;
}) {
  return (
    <div className="glass-strong border-hairline rounded-card flex w-full items-center justify-between border p-3">
      <span className="text-small text-muted">
        {party} {party === 1 ? guestOne : guestMany}
      </span>
      <span className="text-h3 text-foreground">{amountLabel}</span>
    </div>
  );
}
