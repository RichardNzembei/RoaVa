"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Toggle an experience in the signed-in user's wishlist. RLS (wishlist_all_own)
// scopes everything to their own rows. Returns the new saved state, or "auth"
// if not signed in so the UI can send them to sign-in.
export async function toggleWishlist(
  experienceId: string,
): Promise<{ saved: boolean } | { auth: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { auth: true };

  const { data: existing } = await supabase
    .from("wishlist")
    .select("experience_id")
    .eq("profile_id", user.id)
    .eq("experience_id", experienceId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("wishlist")
      .delete()
      .eq("profile_id", user.id)
      .eq("experience_id", experienceId);
    revalidatePath("/wishlist");
    return { saved: false };
  }

  await supabase
    .from("wishlist")
    .insert({ profile_id: user.id, experience_id: experienceId });
  revalidatePath("/wishlist");
  return { saved: true };
}
