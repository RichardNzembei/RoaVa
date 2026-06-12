"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

type StatusResponse = {
  status: string;
  payment: string | null;
  failureReason: string | null;
  hasTicket: boolean;
};

const STK_WINDOW_S = 60; // the M-Pesa prompt window
const RETRY_COOLDOWN_S = 15;

// Plain-language copy per failure mode (§6.5). Mapped from the provider reason.
function failureCopy(reason: string | null): { title: string; detail: string } {
  const r = (reason ?? "").toLowerCase();
  if (r.includes("insufficient") || r.includes("balance"))
    return {
      title: "Not enough M-Pesa balance",
      detail: "Top up or use Fuliza, then try again.",
    };
  if (r.includes("pin"))
    return {
      title: "Wrong M-Pesa PIN",
      detail: "Try again and enter your PIN carefully.",
    };
  if (r.includes("cancel"))
    return {
      title: "Payment cancelled",
      detail: "You dismissed the prompt. Try again when you're ready.",
    };
  if (r.includes("timeout") || r.includes("timed out"))
    return {
      title: "The prompt timed out",
      detail: "We didn't get a response in time. Resend and check your phone.",
    };
  if (r.includes("network") || r.includes("ussd"))
    return {
      title: "Network hiccup",
      detail: "M-Pesa was briefly unreachable. Please try again.",
    };
  return {
    title: "Payment didn't go through",
    detail: "Something went wrong. You can try again.",
  };
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
}: {
  bookingId: string;
  initialStatus: string;
  title: string;
  dateLabel: string;
  party: number;
  amountLabel: string;
  retryHref: string;
  manualPaybill: string | null;
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
    poll();
    timer.current = setInterval(poll, 3000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [poll, settled]);

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
        <div className="bg-success/15 text-success flex h-16 w-16 items-center justify-center rounded-full text-h1">
          ✓
        </div>
        <h1 className="text-h1 text-foreground">Booking confirmed</h1>
        <p className="text-body text-muted">
          You&apos;re all set for {title} on {dateLabel}.
        </p>
        <Summary party={party} amountLabel={amountLabel} />
        <p className="text-caption text-muted">
          We&apos;ve sent your booking reference to your phone.
        </p>
        <Link
          href={`/tickets/${bookingId}`}
          className={buttonClasses("primary", true)}
        >
          View your ticket
        </Link>
      </div>
    );
  }

  if (data.status === "cancelled") {
    const copy = failureCopy(data.failureReason);
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
            Try again in {cooldown}s
          </button>
        ) : (
          <Link href={retryHref} className={buttonClasses("primary", true)}>
            Try again
          </Link>
        )}

        {manualPaybill ? (
          <div className="border-hairline rounded-card bg-surface flex flex-col gap-1 border p-4">
            <span className="text-small text-foreground">Pay manually instead</span>
            <p className="text-caption text-muted">
              M-Pesa Paybill {manualPaybill}, account{" "}
              <span className="text-foreground">{bookingId.slice(0, 8)}</span>,
              amount {amountLabel}. We&apos;ll confirm once received.
            </p>
          </div>
        ) : null}

        <Link href="/experiences" className="text-small text-muted text-center">
          Browse other experiences
        </Link>
      </div>
    );
  }

  // Pending — the calm waiting state.
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="border-sunset h-16 w-16 animate-spin rounded-full border-4 border-t-transparent motion-reduce:animate-none" />
      <div className="flex flex-col gap-2">
        <h1 className="text-h1 text-foreground">Check your phone</h1>
        <p className="text-body text-muted">
          We&apos;ve sent an M-Pesa prompt — enter your PIN to confirm{" "}
          {amountLabel} for {title}.
        </p>
      </div>
      <p className="text-small text-muted" aria-live="polite">
        {secondsLeft > 0
          ? `Waiting for confirmation… ${secondsLeft}s`
          : "Still confirming — hang tight, this can take a moment."}
      </p>
      <Summary party={party} amountLabel={amountLabel} />
    </div>
  );
}

function Summary({ party, amountLabel }: { party: number; amountLabel: string }) {
  return (
    <div className="border-hairline rounded-card bg-surface flex w-full items-center justify-between border p-3">
      <span className="text-small text-muted">
        {party} {party === 1 ? "guest" : "guests"}
      </span>
      <span className="text-h3 text-foreground">{amountLabel}</span>
    </div>
  );
}
