// Currency is always explicit and in whole shillings (CLAUDE.md §8 / design).
export function formatKes(amountKes: number): string {
  return `KES ${Math.round(amountKes).toLocaleString("en-KE")}`;
}

// Short, local-friendly date/time for slots, e.g. "Sat 14 Jun, 9:00 AM".
// Always rendered in East Africa Time so operators and guests see the same
// wall-clock time regardless of device/server timezone.
export const KENYA_TZ = "Africa/Nairobi";

export function formatSlotDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-KE", {
    timeZone: KENYA_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
