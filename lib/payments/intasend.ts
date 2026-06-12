import "server-only";

import { serverEnv } from "@/lib/env";
import type {
  InitiateParams,
  PaymentProvider,
  ProviderState,
  StkInitResult,
} from "./types";

/*
  IntaSend M-Pesa STK collection (CLAUDE.md §2). Pass-through/non-custodial:
  IntaSend collects and settles; we only initiate and read status.

  NOTE: endpoint shapes and field names should be re-verified against current
  IntaSend docs and a sandbox account before going live (flagged in CLAUDE.md).
  Until real keys are set the app uses the mock provider instead.
*/
const LIVE_BASE = "https://payment.intasend.com";
const SANDBOX_BASE = "https://sandbox.intasend.com";

export class IntaSendProvider implements PaymentProvider {
  readonly name = "intasend";

  private base(): string {
    return serverEnv.intasend.testMode ? SANDBOX_BASE : LIVE_BASE;
  }

  async initiateStk(params: InitiateParams): Promise<StkInitResult> {
    try {
      const res = await fetch(`${this.base()}/api/v1/payment/mpesa-stk-push/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serverEnv.intasend.secretKey}`,
        },
        body: JSON.stringify({
          public_key: serverEnv.intasend.publishableKey,
          amount: params.amountKes,
          phone_number: params.phone.replace(/^\+/, ""),
          api_ref: params.reference,
          narrative: params.narrative,
        }),
      });

      if (!res.ok) {
        return { ok: false, error: `Provider returned ${res.status}` };
      }
      const data = (await res.json()) as {
        invoice?: { invoice_id?: string };
        id?: string;
      };
      const ref = data.invoice?.invoice_id ?? data.id;
      if (!ref) return { ok: false, error: "No invoice id in response." };
      return { ok: true, providerRef: ref };
    } catch {
      return { ok: false, error: "Could not reach the payment provider." };
    }
  }

  async getStatus(providerRef: string): Promise<ProviderState> {
    try {
      const res = await fetch(`${this.base()}/api/v1/payment/status/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serverEnv.intasend.secretKey}`,
        },
        body: JSON.stringify({
          public_key: serverEnv.intasend.publishableKey,
          invoice_id: providerRef,
        }),
      });
      if (!res.ok) return "pending";
      const data = (await res.json()) as { invoice?: { state?: string } };
      return mapState(data.invoice?.state);
    } catch {
      return "pending";
    }
  }
}

// IntaSend invoice states → our coarse provider state.
export function mapState(state: string | undefined): ProviderState {
  switch ((state ?? "").toUpperCase()) {
    case "COMPLETE":
      return "success";
    case "FAILED":
      return "failed";
    default:
      return "pending"; // PENDING, PROCESSING, etc.
  }
}
