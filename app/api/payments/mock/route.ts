import { NextResponse, type NextRequest } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { processCallback } from "@/lib/payments/webhook";
import { stageMockStatus } from "@/lib/payments/mock";
import type { ProviderState } from "@/lib/payments/types";

// DEV-ONLY simulator of the async M-Pesa callback. Disabled in production and
// when a real provider is configured. Lets us drive every outcome on demand.
//
// mode "deliver" (default): simulates the callback arriving — calls the same
// webhook handler a real provider would. mode "stage": simulates "the payment
// settled at the provider but the callback was MISSED" — records the status so a
// later reconciliation poll (getStatus) discovers it and confirms. This lets the
// reconcile poll→confirm path be tested locally, not just the expire path.
const OUTCOMES: Record<string, { state: ProviderState; reason?: string }> = {
  success: { state: "success" },
  insufficient_funds: { state: "failed", reason: "insufficient funds" },
  wrong_pin: { state: "failed", reason: "wrong pin" },
  cancelled: { state: "failed", reason: "cancelled by user" },
  network: { state: "failed", reason: "network/ussd error" },
  timeout: { state: "failed", reason: "timeout" },
  failed: { state: "failed", reason: "failed" },
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
    return NextResponse.json({ error: "providerRef and valid outcome required" }, { status: 400 });
  }

  // Stage the provider status for the reconciliation poll path, without delivering
  // a callback — i.e. the success/failure happened but the webhook never arrived.
  if (body.mode === "stage") {
    stageMockStatus(body.providerRef, outcome.state);
    return NextResponse.json({ staged: true, providerRef: body.providerRef, state: outcome.state });
  }

  const res = await processCallback({
    providerRef: body.providerRef,
    state: outcome.state,
    failureReason: outcome.reason,
    raw: { mock: true, outcome: body.outcome },
  });

  return NextResponse.json(res);
}
