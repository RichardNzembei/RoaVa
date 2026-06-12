"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  const rating = Number(formData.get("rating"));
  const body = String(formData.get("body") ?? "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { status: "error", message: "Tap a star rating from 1 to 5." };
  }
  if (body.length > 1000) {
    return { status: "error", message: "Please keep your review under 1000 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { error } = await supabase.from("reviews").insert({
    experience_id: experienceId,
    booking_id: bookingId,
    consumer_profile_id: user.id,
    rating,
    body: body || null,
  });

  if (error) {
    // Most likely RLS (not a completed booking) or a duplicate review.
    return {
      status: "error",
      message: "We couldn't post that review. You can only review a trip you've completed, once.",
    };
  }

  redirect(`/experiences/${experienceId}`);
}
