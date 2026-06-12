import { describe, it, expect } from "vitest";
import {
  commissionKes,
  classifyFailure,
  PLATFORM_COMMISSION_RATE,
} from "@/lib/payments";

describe("commissionKes", () => {
  it("is 10% rounded to whole shillings", () => {
    expect(PLATFORM_COMMISSION_RATE).toBe(0.1);
    expect(commissionKes(1000)).toBe(100);
    expect(commissionKes(2500)).toBe(250);
    expect(commissionKes(3333)).toBe(333); // round(333.3)
    expect(commissionKes(0)).toBe(0);
  });
});

describe("classifyFailure", () => {
  it("maps provider reasons to canonical modes", () => {
    expect(classifyFailure("insufficient funds")).toBe("insufficient_funds");
    expect(classifyFailure("low balance")).toBe("insufficient_funds");
    expect(classifyFailure("wrong PIN")).toBe("wrong_pin");
    expect(classifyFailure("cancelled by user")).toBe("cancelled");
    expect(classifyFailure("timeout")).toBe("timeout");
    expect(classifyFailure("network/ussd error")).toBe("network");
    expect(classifyFailure("something odd")).toBe("failed");
    expect(classifyFailure(null)).toBe("failed");
    expect(classifyFailure(undefined)).toBe("failed");
  });
});
