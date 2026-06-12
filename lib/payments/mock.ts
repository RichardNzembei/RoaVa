import "server-only";

import type {
  DisburseInitResult,
  DisburseParams,
  InitiateParams,
  PaymentProvider,
  ProviderState,
  StkInitResult,
} from "./types";

/*
  Local mock provider — lets us exercise the entire pending→callback→confirm
  flow (and every failure mode) without live M-Pesa credentials.

  initiateStk just mints a provider reference and returns "accepted" (mirroring
  that an STK request only means the prompt was SENT — never that it was paid).
  The async result is delivered by hitting the dev-only trigger endpoint, which
  calls the same webhook handler a real provider would. getStatus stays pending
  (the mock has no out-of-band state), so the reconciliation timeout path can be
  tested too.
*/
export class MockProvider implements PaymentProvider {
  readonly name = "mock";

  async initiateStk(params: InitiateParams): Promise<StkInitResult> {
    if (params.amountKes <= 0) {
      return { ok: false, error: "Invalid amount." };
    }
    return { ok: true, providerRef: `mock_${params.reference}` };
  }

  async getStatus(_providerRef: string): Promise<ProviderState> {
    return "pending";
  }

  // Payout mirror: minting a ref means the disbursement was ACCEPTED, not paid.
  // The result is delivered via the dev-only payout trigger endpoint.
  async disburse(params: DisburseParams): Promise<DisburseInitResult> {
    if (params.amountKes <= 0) {
      return { ok: false, error: "Invalid amount." };
    }
    return { ok: true, providerRef: `mockpayout_${params.reference}` };
  }

  async getPayoutStatus(_providerRef: string): Promise<ProviderState> {
    return "pending";
  }
}
