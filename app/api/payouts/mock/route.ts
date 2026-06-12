import { NextResponse, type NextRequest } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { processPayoutCallback } from "@/lib/payouts/webhook";
import type { ProviderState } from "@/lib/payments/types";

// DEV-ONLY simulator of the async B2C payout callback. Disabled in production
// and when a real provider is configured. Lets us drive the operator payout
// pending→paid (and failed) flow on demand, end to end.
const OUTCOMES: Record<string, { state: ProviderState; reason?: string }> = {
  success: { state: "success" },
  failed: { state: "failed", reason: "transfer failed" },
};

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }
  if (getPaymentProvider().name !== "mock") {
    return NextResponse.json({ error: "mock provider not active" }, { status: 404 });
  }

  let body: { providerRef?: string; outcome?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const outcome = OUTCOMES[body.outcome ?? "success"];
  if (!body.providerRef || !outcome) {
    return NextResponse.json(
      { error: "providerRef and valid outcome required" },
      { status: 400 },
    );
  }

  const res = await processPayoutCallback({
    providerRef: body.providerRef,
    state: outcome.state,
    failureReason: outcome.reason,
    raw: { mock: true, outcome: body.outcome },
  });

  return NextResponse.json(res);
}
