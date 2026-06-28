"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, m } from "motion/react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { payWithMpesa, type CheckoutState } from "./actions";

export type CheckoutLabels = {
  mpesaLabel: string;
  mpesaHint: string;
  pay: string;
  paying: string;
  payNote: string;
  giftToggle: string;
  giftRecipientLabel: string;
  giftRecipientHint: string;
  giftMessageLabel: string;
};

function PayButton({ idle, busy }: { idle: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth disabled={pending} aria-busy={pending}>
      {pending ? busy : idle}
    </Button>
  );
}

export function CheckoutForm({
  experienceId,
  slotId,
  party,
  defaultPhone,
  labels,
}: {
  experienceId: string;
  slotId: string;
  party: number;
  defaultPhone: string;
  labels: CheckoutLabels;
}) {
  const action = payWithMpesa.bind(null, experienceId);
  const [state, formAction] = useActionState<CheckoutState, FormData>(action, {
    status: "idle",
  });
  const [gift, setGift] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="slot" value={slotId} />
      <input type="hidden" name="party" value={party} />
      <TextField
        label={labels.mpesaLabel}
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        defaultValue={defaultPhone}
        placeholder="0712 345 678"
        hint={labels.mpesaHint}
        error={state.status === "error" ? state.message : undefined}
      />

      {/* Gifting (diaspora slice): book for someone else; they redeem a code. */}
      <label className="flex min-h-12 items-center gap-3">
        <input
          type="checkbox"
          name="gift"
          checked={gift}
          onChange={(e) => setGift(e.target.checked)}
          className="accent-sunset h-4 w-4"
        />
        <span className="text-small text-foreground">{labels.giftToggle}</span>
      </label>

      {/* Gift panel slides open rather than snapping in — height + opacity only,
          on the house ease; collapses on exit. Reduced-motion users get an
          instant toggle via MotionConfig. */}
      <AnimatePresence initial={false}>
        {gift ? (
          <m.div
            key="gift-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="glass border-hairline flex flex-col gap-4 rounded-card border p-4">
              <TextField
                label={labels.giftRecipientLabel}
                name="recipient"
                type="text"
                inputMode="email"
                autoComplete="off"
                placeholder="0712 345 678 / them@example.com"
                hint={labels.giftRecipientHint}
              />
              <TextField
                label={labels.giftMessageLabel}
                name="gift_message"
                type="text"
                autoComplete="off"
                placeholder="Enjoy! 🎁"
              />
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>

      <PayButton idle={labels.pay} busy={labels.paying} />
      <p className="text-caption text-muted text-center">{labels.payNote}</p>
    </form>
  );
}
