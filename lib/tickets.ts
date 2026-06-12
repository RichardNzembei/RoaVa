import "server-only";

import crypto from "node:crypto";
import { serverEnv } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";

/*
  Signed single-use ticket QR (CLAUDE.md §4.4). The QR payload is
  `${bookingId}.${nonce}.${hmac}` where the HMAC is computed server-side with a
  server-only secret. Verification + atomic mark-used happens on check-in (M5);
  a screenshot can't be forged without the secret, and a used ticket can't be
  reused. Token carries no PII.
*/
function hmac(payload: string): string {
  return crypto
    .createHmac("sha256", serverEnv.ticketSigningSecret())
    .update(payload)
    .digest("hex");
}

export function signTicket(bookingId: string, nonce: string): string {
  const payload = `${bookingId}.${nonce}`;
  return `${payload}.${hmac(payload)}`;
}

export function verifyTicket(
  token: string,
): { bookingId: string; nonce: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [bookingId, nonce, sig] = parts;
  const expected = hmac(`${bookingId}.${nonce}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return { bookingId, nonce };
}

// Issue a ticket for a confirmed booking. Idempotent: a unique (booking_id)
// constraint means a retried webhook never creates a second ticket. Returns
// true ONLY when this call created the ticket (used to fire one-time side
// effects like the confirmation SMS exactly once).
export async function issueTicketForBooking(bookingId: string): Promise<boolean> {
  const service = createServiceClient();

  const { data: existing } = await service
    .from("tickets")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (existing) return false;

  const nonce = crypto.randomUUID();
  const qrPayload = signTicket(bookingId, nonce);

  // The unique constraint is the real guarantee against races — if a concurrent
  // callback inserted first, our insert errors and we report "not created".
  const { error } = await service
    .from("tickets")
    .insert({ booking_id: bookingId, qr_payload: qrPayload, nonce, status: "valid" });

  return !error;
}
