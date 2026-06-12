"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOperator } from "@/lib/auth";

export type SlotFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; added: number };

const MAX_REPEAT_WEEKS = 12;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Add one slot, or a weekly-repeating series. Times are entered in EAT (+03:00)
// and stored as UTC timestamptz.
export async function addSlots(
  experienceId: string,
  _prev: SlotFormState,
  formData: FormData,
): Promise<SlotFormState> {
  await requireOperator();

  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const capacity = Number(String(formData.get("capacity") ?? "").trim());
  const repeatWeeks = Number(String(formData.get("repeat_weeks") ?? "1").trim());
  const overrideRaw = String(formData.get("price_override") ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return { status: "error", message: "Choose a date and time." };
  }
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000) {
    return { status: "error", message: "Capacity must be between 1 and 1000." };
  }
  if (!Number.isInteger(repeatWeeks) || repeatWeeks < 1 || repeatWeeks > MAX_REPEAT_WEEKS) {
    return { status: "error", message: `Repeat must be 1 to ${MAX_REPEAT_WEEKS} weeks.` };
  }
  let priceOverride: number | null = null;
  if (overrideRaw) {
    const n = Number(overrideRaw.replace(/[,\s]/g, ""));
    if (!Number.isInteger(n) || n < 0) {
      return { status: "error", message: "Price override must be a whole KES amount." };
    }
    priceOverride = n;
  }

  // Interpret the entered wall-clock time as East Africa Time (UTC+3).
  const base = new Date(`${date}T${time}:00+03:00`);
  if (Number.isNaN(base.getTime())) {
    return { status: "error", message: "That date/time isn't valid." };
  }
  if (base.getTime() <= Date.now()) {
    return { status: "error", message: "Pick a time in the future." };
  }

  const rows = Array.from({ length: repeatWeeks }, (_, i) => ({
    experience_id: experienceId,
    start_at: new Date(base.getTime() + i * WEEK_MS).toISOString(),
    capacity,
    price_override: priceOverride,
    status: "open" as const,
  }));

  // RLS (owns_experience) ensures only this experience's owner can insert.
  const supabase = await createClient();
  const { error } = await supabase.from("availability_slots").insert(rows);
  if (error) {
    return { status: "error", message: "We couldn't add those slots. Please try again." };
  }

  revalidatePath(`/operator/experiences/${experienceId}`);
  return { status: "success", added: rows.length };
}

// Delete a slot — refused if anyone has already booked it (protect records).
export async function deleteSlot(experienceId: string, slotId: string) {
  await requireOperator();
  const supabase = await createClient();

  const { data: slot } = await supabase
    .from("availability_slots")
    .select("booked_count")
    .eq("id", slotId)
    .maybeSingle();

  if (slot && slot.booked_count > 0) {
    // Don't destroy a slot with bookings; close it instead.
    await supabase
      .from("availability_slots")
      .update({ status: "closed" })
      .eq("id", slotId);
  } else {
    await supabase.from("availability_slots").delete().eq("id", slotId);
  }

  revalidatePath(`/operator/experiences/${experienceId}`);
}
