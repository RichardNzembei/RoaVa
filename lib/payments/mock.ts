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
  calls the same webhook handler a real provider would.

  getStatus defaults to "pending" (the mock has no out-of-band state), so the
  reconciliation timeout/expire path can be tested. A dev-only registry lets a
  ref be *staged* with a settled status — simulating "the payment settled at the
  provider but the callback was missed" — so the reconciliation poll→confirm
  path is testable locally too. Staging is dev-only and never reached in prod
  (the mock isn't active there).
*/
const stagedStatuses = new Map<string, ProviderState>();
const stagedPayoutStatuses = new Map<string, ProviderState>();

/** DEV ONLY: stage the status a later getStatus() poll will report for a ref. */
export function stageMockStatus(providerRef: string, state: ProviderState): void {
  stagedStatuses.set(providerRef, state);
}

/** DEV ONLY: stage the status a later getPayoutStatus() poll will report. */
export function stageMockPayoutStatus(
  providerRef: string,
  state: ProviderState,
): void {
  stagedPayoutStatuses.set(providerRef, state);
}

export class MockProvider implements PaymentProvider {
  readonly name = "mock";

  async initiateStk(params: InitiateParams): Promise<StkInitResult> {
    if (params.amountKes <= 0) {
      return { ok: false, error: "Invalid amount." };
    }
    return { ok: true, providerRef: `mock_${params.reference}` };
  }

  async getStatus(providerRef: string): Promise<ProviderState> {
    return stagedStatuses.get(providerRef) ?? "pending";
  }

  // Payout mirror: minting a ref means the disbursement was ACCEPTED, not paid.
  // The result is delivered via the dev-only payout trigger endpoint.
  async disburse(params: DisburseParams): Promise<DisburseInitResult> {
    if (params.amountKes <= 0) {
      return { ok: false, error: "Invalid amount." };
    }
    return { ok: true, providerRef: `mockpayout_${params.reference}` };
  }

  async getPayoutStatus(providerRef: string): Promise<ProviderState> {
    return stagedPayoutStatuses.get(providerRef) ?? "pending";
  }
}
