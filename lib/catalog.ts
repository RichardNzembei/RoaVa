// Curated, v1-fixed taxonomy. Simple ranking only (CLAUDE.md scope), so these
// are display + filter buckets, not an ML category system.

export const CATEGORIES = [
  "Hiking & nature",
  "Wildlife & safari",
  "Water & beach",
  "Cultural & heritage",
  "Food & drink",
  "Adventure & sport",
  "City & tours",
  "Wellness",
  "Family",
] as const;

export type Category = (typeof CATEGORIES)[number];

// Counties within reach of Nairobi for the v1 wedge.
export const COUNTIES = [
  "Nairobi",
  "Kiambu",
  "Kajiado",
  "Machakos",
  "Murang'a",
  "Nakuru",
  "Narok",
  "Nyandarua",
] as const;

export type County = (typeof COUNTIES)[number];

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

export function isCounty(value: string): value is County {
  return (COUNTIES as readonly string[]).includes(value);
}
