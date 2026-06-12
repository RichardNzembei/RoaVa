import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type { ProviderState } from "@/lib/payments/types";

export type PayoutCallbackInput = {
  providerRef: string;
  state: ProviderState;
  failureReason?: string;
  raw?: unknown;
};

export type PayoutCallbackResult = {
  handled: boolean;
  bookingId: string | null;
};

/*
  Single idempotent entry point for resolving a payout — used by the provider
  webhook AND the reconciliation poll AND the dev mock trigger. All exactly-once
  safety lives in the DB functions (FOR UPDATE + pending-only transitions), so
  calling this twice with the same ref is a no-op (mirrors processCallback).
*/
export async function processPayoutCallback(
  input: PayoutCallbackInput,
): Promise<PayoutCallbackResult> {
  const service = createServiceClient();
  const raw = (input.raw ?? null) as never;

  if (input.state === "success") {
    const { data: bookingId } = await service.rpc("confirm_payout", {
      p_provider_ref: input.providerRef,
      p_raw: raw,
    });
    return { handled: true, bookingId: (bookingId as string) ?? null };
  }

  if (input.state === "failed") {
    const { data: bookingId } = await service.rpc("fail_payout", {
      p_provider_ref: input.providerRef,
      p_reason: input.failureReason ?? "failed",
      p_raw: raw,
    });
    return { handled: true, bookingId: (bookingId as string) ?? null };
  }

  // pending → nothing to do yet.
  return { handled: false, bookingId: null };
}
