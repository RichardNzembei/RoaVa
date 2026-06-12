import { describe, it, expect } from "vitest";
import { signTicket, verifyTicket } from "@/lib/tickets";

const bookingId = "11111111-1111-1111-1111-111111111111";
const nonce = "22222222-2222-2222-2222-222222222222";

describe("ticket HMAC sign/verify", () => {
  it("round-trips a signed token", () => {
    const token = signTicket(bookingId, nonce);
    expect(token.startsWith(`${bookingId}.${nonce}.`)).toBe(true);
    expect(verifyTicket(token)).toEqual({ bookingId, nonce });
  });

  it("is deterministic for the same input", () => {
    expect(signTicket(bookingId, nonce)).toBe(signTicket(bookingId, nonce));
  });

  it("rejects a tampered signature", () => {
    const token = signTicket(bookingId, nonce);
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    expect(verifyTicket(tampered)).toBeNull();
  });

  it("rejects a forged token (different nonce, recomputed by an attacker without the secret)", () => {
    // Attacker keeps bookingId+nonce but can't produce a valid sig.
    const forged = `${bookingId}.${nonce}.${"0".repeat(64)}`;
    expect(verifyTicket(forged)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyTicket("not-a-token")).toBeNull();
    expect(verifyTicket("a.b")).toBeNull();
    expect(verifyTicket("")).toBeNull();
  });
});
