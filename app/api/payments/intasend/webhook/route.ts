import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/lib/env";
import { processCallback } from "@/lib/payments/webhook";
import { mapState } from "@/lib/payments/intasend";

// IntaSend payment callback. Idempotent (processCallback). We always return 200
// once we've accepted the payload so the provider doesn't retry forever; a
// missed callback is still caught by the reconciliation poll.
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

  const invoice = (body.invoice ?? body) as Record<string, unknown>;
  const providerRef =
    (invoice.invoice_id as string) ?? (body.invoice_id as string);
  if (!providerRef) {
    return NextResponse.json({ error: "no invoice id" }, { status: 400 });
  }

  const state = mapState(invoice.state as string | undefined);
  const failureReason =
    (invoice.failed_reason as string) ??
    (invoice.provider_reference as string) ??
    undefined;

  await processCallback({ providerRef, state, failureReason, raw: body });
  return NextResponse.json({ received: true });
}
