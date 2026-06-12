/*
  Kenyan phone-number normalisation to E.164 (+254…).
  Accepts the formats people actually type: 0712345678, 0112345678,
  712345678, +254712345678, 254712345678, with spaces/dashes. Kenyan mobile
  subscriber numbers are 9 digits after the country code and start with 7 or 1.
*/

export type NormalizedPhone = `+254${string}`;

export function normalizeKenyanPhone(input: string): NormalizedPhone | null {
  if (!input) return null;

  // Keep a leading +, drop every other non-digit.
  const cleaned = input.trim().replace(/(?!^\+)[^\d]/g, "");
  let digits = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;

  if (digits.startsWith("254")) {
    digits = digits.slice(3);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // Must now be a 9-digit subscriber number beginning 7 or 1.
  if (!/^[71]\d{8}$/.test(digits)) return null;

  return `+254${digits}`;
}

// Display form: +254 712 345 678 — easy to read back on a small screen.
export function formatKenyanPhone(e164: string): string {
  const m = /^\+254(\d{3})(\d{3})(\d{3})$/.exec(e164);
  if (!m) return e164;
  return `+254 ${m[1]} ${m[2]} ${m[3]}`;
}
