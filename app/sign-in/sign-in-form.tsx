"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { formatKenyanPhone } from "@/lib/phone";
import { GoogleButton } from "./google-button";
import {
  requestOtp,
  verifyOtp,
  type OtpChannel,
  type OtpRequestState,
  type OtpVerifyState,
} from "./actions";

const RESEND_COOLDOWN_SECONDS = 30;

// Localised strings passed in from the (server) page.
export type SignInLabels = {
  methodPhone: string;
  methodEmail: string;
  phoneLabel: string;
  phoneHint: string;
  emailLabel: string;
  emailHint: string;
  send: string;
  sending: string;
  codeLabel: string;
  sentTo: string;
  verify: string;
  verifying: string;
  resend: string;
  resendIn: string;
  change: string;
  or: string;
  google: string;
};

function SubmitButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth disabled={pending} aria-busy={pending}>
      {pending ? busy : idle}
    </Button>
  );
}

export function SignInForm({
  next,
  labels,
}: {
  next?: string;
  labels: SignInLabels;
}) {
  const [method, setMethod] = useState<OtpChannel>("phone");
  const [reqState, requestAction] = useActionState<OtpRequestState, FormData>(
    requestOtp,
    { status: "idle" },
  );
  const [verifyState, verifyAction] = useActionState<OtpVerifyState, FormData>(
    verifyOtp,
    { status: "idle" },
  );

  const sent = reqState.status === "sent" ? reqState : null;
  const [cooldown, setCooldown] = useState(0);

  const lastSent = useRef<string | null>(null);
  useEffect(() => {
    if (reqState.status === "sent" && reqState.identifier !== lastSent.current) {
      lastSent.current = reqState.identifier;
      setCooldown(RESEND_COOLDOWN_SECONDS);
    }
  }, [reqState]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // ── Verify step (shared by both channels) ──────────────────────────────────
  if (sent) {
    const display =
      sent.channel === "phone"
        ? formatKenyanPhone(sent.identifier)
        : sent.identifier;
    return (
      <div className="flex flex-col gap-5">
        <form action={verifyAction} className="flex flex-col gap-5">
          <input type="hidden" name="channel" value={sent.channel} />
          <input type="hidden" name="identifier" value={sent.identifier} />
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <TextField
            label={labels.codeLabel}
            name="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            autoFocus
            placeholder="123456"
            hint={`${labels.sentTo} ${display}.`}
            error={
              verifyState.status === "error" ? verifyState.message : undefined
            }
          />
          <SubmitButton idle={labels.verify} busy={labels.verifying} />
        </form>

        <div className="flex items-center justify-between">
          <form action={requestAction}>
            <input type="hidden" name="channel" value={sent.channel} />
            <input
              type="hidden"
              name={sent.channel === "phone" ? "phone" : "email"}
              value={sent.identifier}
            />
            <button
              type="submit"
              disabled={cooldown > 0}
              className="text-small text-sunset disabled:text-muted disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? `${labels.resendIn} ${cooldown}s` : labels.resend}
            </button>
          </form>
          <button
            type="button"
            onClick={() => {
              lastSent.current = null;
              window.location.assign(
                next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in",
              );
            }}
            className="text-small text-muted"
          >
            {labels.change}
          </button>
        </div>
      </div>
    );
  }

  // ── Request step — method toggle + phone/email field, then Google ───────────
  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label={labels.methodPhone + " / " + labels.methodEmail}
        className="border-hairline bg-surface flex gap-1 rounded-base border p-1"
      >
        <MethodTab
          active={method === "phone"}
          onClick={() => setMethod("phone")}
          label={labels.methodPhone}
        />
        <MethodTab
          active={method === "email"}
          onClick={() => setMethod("email")}
          label={labels.methodEmail}
        />
      </div>

      <form action={requestAction} className="flex flex-col gap-5">
        <input type="hidden" name="channel" value={method} />
        {method === "phone" ? (
          <TextField
            key="phone"
            label={labels.phoneLabel}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            autoFocus
            placeholder="0712 345 678"
            hint={labels.phoneHint}
            error={reqState.status === "error" ? reqState.message : undefined}
          />
        ) : (
          <TextField
            key="email"
            label={labels.emailLabel}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            hint={labels.emailHint}
            error={reqState.status === "error" ? reqState.message : undefined}
          />
        )}
        <SubmitButton idle={labels.send} busy={labels.sending} />
      </form>

      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="border-hairline h-px flex-1 border-t" />
        <span className="text-caption text-muted">{labels.or}</span>
        <span className="border-hairline h-px flex-1 border-t" />
      </div>

      <GoogleButton label={labels.google} next={next} />
    </div>
  );
}

function MethodTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`text-small ease-out-soft min-h-10 flex-1 rounded-[6px] px-3 transition-colors ${
        active
          ? "bg-accent-strong text-accent-contrast"
          : "text-muted active:bg-accent-soft"
      }`}
    >
      {label}
    </button>
  );
}
