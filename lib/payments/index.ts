import "server-only";

import { serverEnv } from "@/lib/env";
import type { PaymentProvider, FailureMode } from "./types";
import { MockProvider } from "./mock";
import { IntaSendProvider } from "./intasend";

export type { PaymentProvider, FailureMode } from "./types";

// Platform commission retained as a defined fee on the pass-through flow
// (CLAUDE.md §3). PRODUCT DECISION — confirm the rate before launch.
export const PLATFORM_COMMISSION_RATE = 0.1;

export function commissionKes(amountKes: number): number {
  return Math.round(amountKes * PLATFORM_COMMISSION_RATE);
}

// Choose the provider: explicit override, else IntaSend when keys exist,
// else the local mock (so dev/test works with no credentials).
export function getPaymentProvider(): PaymentProvider {
  if (serverEnv.paymentsProvider === "mock") return new MockProvider();
  if (serverEnv.paymentsProvider === "intasend") return new IntaSendProvider();

  const hasKeys =
    serverEnv.intasend.secretKey && serverEnv.intasend.publishableKey;
  return hasKeys ? new IntaSendProvider() : new MockProvider();
}

// Map free-text provider failure reasons to our canonical modes for UX copy.
export function classifyFailure(reason: string | null | undefined): FailureMode {
  const r = (reason ?? "").toLowerCase();
  if (r.includes("insufficient") || r.includes("balance")) return "insufficient_funds";
  if (r.includes("pin")) return "wrong_pin";
  if (r.includes("cancel")) return "cancelled";
  if (r.includes("timeout") || r.includes("timed out")) return "timeout";
  if (r.includes("network") || r.includes("ussd") || r.includes("unreachable")) return "network";
  return "failed";
}
