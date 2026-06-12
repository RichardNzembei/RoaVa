"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOperator } from "@/lib/auth";
import { isCategory, isCounty } from "@/lib/catalog";

export type FormState = { status: "idle" } | { status: "error"; message: string };

const MAX_PRICE_KES = 1_000_000;

function parsePrice(raw: FormDataEntryValue | null): number | null {
  const n = Number(String(raw ?? "").replace(/[,\s]/g, ""));
  if (!Number.isInteger(n) || n < 0 || n > MAX_PRICE_KES) return null;
  return n;
}

// Create a draft experience with the core fields, then go to its manage page
// to add details, slots, and images before publishing.
export async function createExperience(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const operator = await requireOperator();

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const county = String(formData.get("county") ?? "").trim();
  const price = parsePrice(formData.get("base_price_kes"));

  if (title.length < 3) return { status: "error", message: "Give your experience a title." };
  if (!isCategory(category)) return { status: "error", message: "Choose a category." };
  if (!isCounty(county)) return { status: "error", message: "Choose a county." };
  if (price === null) return { status: "error", message: "Enter a valid price in KES." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("experiences")
    .insert({
      operator_id: operator.id,
      title,
      category,
      county,
      base_price_kes: price,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: "We couldn't create that. Please try again." };
  }

  redirect(`/operator/experiences/${data.id}`);
}

// Update the full set of editable fields on a draft/published experience.
export async function updateExperience(
  experienceId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireOperator();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const county = String(formData.get("county") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const meetingPoint = String(formData.get("meeting_point") ?? "").trim();
  const cancellation = String(formData.get("cancellation_policy") ?? "").trim();
  const price = parsePrice(formData.get("base_price_kes"));
  const durationRaw = String(formData.get("duration_minutes") ?? "").trim();
  const partyRaw = String(formData.get("max_party_size") ?? "").trim();

  if (title.length < 3) return { status: "error", message: "Give your experience a title." };
  if (!isCategory(category)) return { status: "error", message: "Choose a category." };
  if (!isCounty(county)) return { status: "error", message: "Choose a county." };
  if (price === null) return { status: "error", message: "Enter a valid price in KES." };

  const duration = durationRaw ? Number(durationRaw) : null;
  if (duration !== null && (!Number.isInteger(duration) || duration <= 0)) {
    return { status: "error", message: "Duration must be a whole number of minutes." };
  }
  const maxParty = partyRaw ? Number(partyRaw) : 10;
  if (!Number.isInteger(maxParty) || maxParty <= 0) {
    return { status: "error", message: "Max party size must be a positive whole number." };
  }

  // RLS (owns_experience) scopes this to the operator's own row.
  const supabase = await createClient();
  const { error } = await supabase
    .from("experiences")
    .update({
      title,
      description: description || null,
      category,
      county,
      area: area || null,
      meeting_point: meetingPoint || null,
      cancellation_policy: cancellation || null,
      base_price_kes: price,
      duration_minutes: duration,
      max_party_size: maxParty,
    })
    .eq("id", experienceId);

  if (error) return { status: "error", message: "We couldn't save changes. Please try again." };

  revalidatePath(`/operator/experiences/${experienceId}`);
  return { status: "idle" };
}

// Publish — guarded so a half-finished listing never goes live.
export async function publishExperience(
  experienceId: string,
  _prev: FormState,
  _formData: FormData,
): Promise<FormState> {
  await requireOperator();
  const supabase = await createClient();

  const { data: exp } = await supabase
    .from("experiences")
    .select("id, title, base_price_kes, images, meeting_point")
    .eq("id", experienceId)
    .maybeSingle();

  if (!exp) return { status: "error", message: "Experience not found." };
  if (!exp.images || exp.images.length === 0) {
    return { status: "error", message: "Add at least one photo before publishing." };
  }
  if (!exp.meeting_point) {
    return { status: "error", message: "Add a meeting point before publishing." };
  }

  const { count } = await supabase
    .from("availability_slots")
    .select("id", { count: "exact", head: true })
    .eq("experience_id", experienceId)
    .eq("status", "open")
    .gt("start_at", new Date().toISOString());

  if (!count || count === 0) {
    return { status: "error", message: "Add at least one upcoming time slot before publishing." };
  }

  const { error } = await supabase
    .from("experiences")
    .update({ status: "published" })
    .eq("id", experienceId);

  if (error) return { status: "error", message: "We couldn't publish. Please try again." };

  revalidatePath(`/operator/experiences/${experienceId}`);
  revalidatePath("/operator");
  return { status: "idle" };
}

export async function unpublishExperience(experienceId: string) {
  await requireOperator();
  const supabase = await createClient();
  await supabase
    .from("experiences")
    .update({ status: "draft" })
    .eq("id", experienceId);
  revalidatePath(`/operator/experiences/${experienceId}`);
  revalidatePath("/operator");
}

export async function deleteExperience(experienceId: string) {
  await requireOperator();
  const supabase = await createClient();
  await supabase.from("experiences").delete().eq("id", experienceId);
  revalidatePath("/operator");
  redirect("/operator");
}
