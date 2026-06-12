import { NextResponse, type NextRequest } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { processCallback } from "@/lib/payments/webhook";
import type { ProviderState } from "@/lib/payments/types";

// DEV-ONLY simulator of the async M-Pesa callback. Disabled in production and
// when a real provider is configured. Lets us drive every outcome on demand.
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

  let body: { providerRef?: string; outcome?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const outcome = OUTCOMES[body.outcome ?? "success"];
  if (!body.providerRef || !outcome) {
    return NextResponse.json({ error: "providerRef and valid outcome required" }, { status: 400 });
  }

  const res = await processCallback({
    providerRef: body.providerRef,
    state: outcome.state,
    failureReason: outcome.reason,
    raw: { mock: true, outcome: body.outcome },
  });

  return NextResponse.json(res);
}
