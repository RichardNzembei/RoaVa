import { describe, it, expect } from "vitest";
import { normalizeKenyanPhone, formatKenyanPhone } from "@/lib/phone";

describe("normalizeKenyanPhone", () => {
  it("normalises common Kenyan formats to E.164", () => {
    expect(normalizeKenyanPhone("0712345678")).toBe("+254712345678");
    expect(normalizeKenyanPhone("0112345678")).toBe("+254112345678");
    expect(normalizeKenyanPhone("712345678")).toBe("+254712345678");
    expect(normalizeKenyanPhone("254712345678")).toBe("+254712345678");
    expect(normalizeKenyanPhone("+254712345678")).toBe("+254712345678");
    expect(normalizeKenyanPhone("0712 345 678")).toBe("+254712345678");
    expect(normalizeKenyanPhone("0712-345-678")).toBe("+254712345678");
  });

  it("rejects invalid numbers", () => {
    expect(normalizeKenyanPhone("")).toBeNull();
    expect(normalizeKenyanPhone("123")).toBeNull();
    expect(normalizeKenyanPhone("0812345678")).toBeNull(); // 8 not a valid prefix
    expect(normalizeKenyanPhone("07123456789")).toBeNull(); // too long
    expect(normalizeKenyanPhone("abc")).toBeNull();
  });
});

describe("formatKenyanPhone", () => {
  it("groups for readability", () => {
    expect(formatKenyanPhone("+254712345678")).toBe("+254 712 345 678");
  });
});
