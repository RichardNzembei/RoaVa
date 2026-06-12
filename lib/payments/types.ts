// Payment provider contract. Roava is non-custodial pass-through (CLAUDE.md §3):
// the licensed provider collects from the buyer and settles to the operator; we
// never hold funds. This interface only initiates a charge and reads its state.

export type ProviderState = "pending" | "success" | "failed";

export type InitiateParams = {
  amountKes: number;
  /** Payer M-Pesa number in E.164 (+254…). */
  phone: string;
  /** Our booking id — the api_ref we reconcile callbacks against. */
  reference: string;
  narrative: string;
};

export type StkInitResult =
  | { ok: true; providerRef: string }
  | { ok: false; error: string };

// Canonical failure modes we surface to the user with tailored copy (§6.5).
export type FailureMode =
  | "timeout"
  | "insufficient_funds"
  | "wrong_pin"
  | "cancelled"
  | "network"
  | "failed";

export interface PaymentProvider {
  readonly name: string;
  initiateStk(params: InitiateParams): Promise<StkInitResult>;
  /** Used by the reconciliation/poll fallback when a callback is missed. */
  getStatus(providerRef: string): Promise<ProviderState>;
}
