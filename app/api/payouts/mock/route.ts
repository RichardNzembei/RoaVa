import { NextResponse, type NextRequest } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { processPayoutCallback } from "@/lib/payouts/webhook";
import { stageMockPayoutStatus } from "@/lib/payments/mock";
import type { ProviderState } from "@/lib/payments/types";

// DEV-ONLY simulator of the async B2C payout callback. Disabled in production
// and when a real provider is configured. Lets us drive the operator payout
// pending→paid (and failed) flow on demand, end to end.
//
// mode "deliver" (default): the callback arrives. mode "stage": the payout
// settled at the provider but the callback was MISSED — records the status so a
// later payout reconciliation poll (getPayoutStatus) discovers and confirms it.
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

  let body: { providerRef?: string; outcome?: string; mode?: "deliver" | "stage" };
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

  // Stage the payout status for the reconciliation poll path (callback missed).
  if (body.mode === "stage") {
    stageMockPayoutStatus(body.providerRef, outcome.state);
    return NextResponse.json({ staged: true, providerRef: body.providerRef, state: outcome.state });
  }

  const res = await processPayoutCallback({
    providerRef: body.providerRef,
    state: outcome.state,
    failureReason: outcome.reason,
    raw: { mock: true, outcome: body.outcome },
  });

  return NextResponse.json(res);
}
