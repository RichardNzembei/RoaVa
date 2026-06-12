"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { formatKenyanPhone } from "@/lib/phone";
import {
  requestOtp,
  verifyOtp,
  type OtpRequestState,
  type OtpVerifyState,
} from "./actions";

const RESEND_COOLDOWN_SECONDS = 30;

// Localised strings passed in from the (server) page.
export type SignInLabels = {
  phoneLabel: string;
  phoneHint: string;
  send: string;
  sending: string;
  codeLabel: string;
  sentTo: string;
  verify: string;
  verifying: string;
  resend: string;
  resendIn: string;
  change: string;
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
  const [reqState, requestAction] = useActionState<OtpRequestState, FormData>(
    requestOtp,
    { status: "idle" },
  );
  const [verifyState, verifyAction] = useActionState<OtpVerifyState, FormData>(
    verifyOtp,
    { status: "idle" },
  );

  const phone = reqState.status === "sent" ? reqState.phone : null;
  const [cooldown, setCooldown] = useState(0);

  const lastSentPhone = useRef<string | null>(null);
  useEffect(() => {
    if (reqState.status === "sent" && reqState.phone !== lastSentPhone.current) {
      lastSentPhone.current = reqState.phone;
      setCooldown(RESEND_COOLDOWN_SECONDS);
    }
  }, [reqState]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!phone) {
    return (
      <form action={requestAction} className="flex flex-col gap-5">
        <TextField
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
        <SubmitButton idle={labels.send} busy={labels.sending} />
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <form action={verifyAction} className="flex flex-col gap-5">
        <input type="hidden" name="phone" value={phone} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <TextField
          label={labels.codeLabel}
          name="token"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          placeholder="123456"
          hint={`${labels.sentTo} ${formatKenyanPhone(phone)}.`}
          error={verifyState.status === "error" ? verifyState.message : undefined}
        />
        <SubmitButton idle={labels.verify} busy={labels.verifying} />
      </form>

      <div className="flex items-center justify-between">
        <form action={requestAction}>
          <input type="hidden" name="phone" value={phone} />
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
            lastSentPhone.current = null;
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
