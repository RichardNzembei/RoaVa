"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n";

export type ReviewState =
  | { status: "idle" }
  | { status: "error"; message: string };

// Submit a review. Inserted under the user's session — RLS enforces that the
// review is for THEIR OWN completed booking (reviews_insert_completed), so the
// rule is guaranteed in the database, not just here.
export async function submitReview(
  bookingId: string,
  experienceId: string,
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const t = await getT();
  const rating = Number(formData.get("rating"));
  const body = String(formData.get("body") ?? "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { status: "error", message: t("err_review_rating") };
  }
  if (body.length > 1000) {
    return { status: "error", message: t("err_review_long") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Keep only photo keys uploaded under this user's own folder for this booking.
  let photos: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("photos") ?? "[]"));
    if (Array.isArray(parsed)) {
      photos = parsed
        .filter((k): k is string => typeof k === "string")
        .filter((k) => k.startsWith(`${user.id}/${bookingId}/`))
        .slice(0, 4);
    }
  } catch {
    photos = [];
  }

  const { error } = await supabase.from("reviews").insert({
    experience_id: experienceId,
    booking_id: bookingId,
    consumer_profile_id: user.id,
    rating,
    body: body || null,
    photos,
  });

  if (error) {
    // Most likely RLS (not a completed booking) or a duplicate review.
    return { status: "error", message: t("err_review_post") };
  }

  redirect(`/experiences/${experienceId}`);
}
