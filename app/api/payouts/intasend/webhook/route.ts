import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";
import { processPayoutCallback } from "@/lib/payouts/webhook";
import { mapTransferState } from "@/lib/payments/intasend";

// IntaSend B2C / send-money callback. Idempotent (processPayoutCallback). We
// always 200 once the payload is accepted so the provider stops retrying; a
// missed callback is still caught by the payout reconciliation poll.
//
// NOTE: the transfer callback payload shape must be confirmed against current
// IntaSend docs + a sandbox account before going live (flagged in CLAUDE.md).
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Verify the shared challenge if configured (IntaSend webhook secret).
  const challenge = serverEnv.intasend.webhookChallenge;
  if (challenge && body.challenge !== challenge) {
    return NextResponse.json({ error: "bad challenge" }, { status: 401 });
  }

  const providerRef =
    (body.tracking_id as string) ?? (body.file_id as string) ?? (body.id as string);
  if (!providerRef) {
    return NextResponse.json({ error: "no tracking id" }, { status: 400 });
  }

  const state = mapTransferState(body.status as string | undefined);
  const failureReason =
    (body.failed_reason as string) ?? (body.status as string) ?? undefined;

  await processPayoutCallback({ providerRef, state, failureReason, raw: body });
  return NextResponse.json({ received: true });
}
