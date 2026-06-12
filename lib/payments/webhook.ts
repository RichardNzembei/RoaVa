import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { issueTicketForBooking } from "@/lib/tickets";
import { sendBookingConfirmedSms } from "@/lib/notifications";
import type { ProviderState } from "./types";

export type CallbackInput = {
  providerRef: string;
  state: ProviderState;
  failureReason?: string;
  raw?: unknown;
};

export type CallbackResult = {
  handled: boolean;
  bookingId: string | null;
};

/*
  The single, idempotent entry point for resolving a payment — used by the
  provider webhook AND the reconciliation poll AND the mock trigger. All the
  exactly-once safety lives in the DB functions (FOR UPDATE + state guards), so
  calling this twice with the same ref is a no-op.
*/
export async function processCallback(
  input: CallbackInput,
): Promise<CallbackResult> {
  const service = createServiceClient();
  const raw = (input.raw ?? null) as never;

  if (input.state === "success") {
    const { data: bookingId } = await service.rpc("confirm_booking_payment", {
      p_provider_ref: input.providerRef,
      p_raw: raw,
    });
    if (bookingId) {
      // Issue the signed ticket (idempotent). SMS fires only on the first
      // confirmation so a retried callback never re-texts the guest.
      const created = await issueTicketForBooking(bookingId as string);
      if (created) await sendBookingConfirmedSms(bookingId as string);
    }
    return { handled: true, bookingId: (bookingId as string) ?? null };
  }

  if (input.state === "failed") {
    const { data: bookingId } = await service.rpc("fail_booking_payment", {
      p_provider_ref: input.providerRef,
      p_reason: input.failureReason ?? "failed",
      p_raw: raw,
    });
    return { handled: true, bookingId: (bookingId as string) ?? null };
  }

  // pending → nothing to do yet.
  return { handled: false, bookingId: null };
}
