import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Operator = Database["public"]["Tables"]["operators"]["Row"];

// The authenticated user (verified against the auth server), or null.
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// The current user's profile row (created by the on-signup trigger), or null.
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data;
}

// Use in protected routes. Redirects to sign-in (preserving the return path),
// and to onboarding until the name is captured (first sign-in).
export async function requireProfile(returnTo?: string): Promise<Profile> {
  const profile = await getProfile();

  if (!profile) {
    const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
    redirect(`/sign-in${next}`);
  }
  if (!profile.name) {
    const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
    redirect(`/onboarding${next}`);
  }
  return profile;
}

// The current user's operator row, or null if they aren't an operator.
export async function getOperator(): Promise<Operator | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("operators")
    .select("*")
    .eq("owner_profile_id", user.id)
    .maybeSingle();

  return data;
}

// Use in operator-only routes. Ensures signed-in + named + has an operator row.
export async function requireOperator(returnTo = "/operator"): Promise<Operator> {
  await requireProfile(returnTo);
  const operator = await getOperator();
  if (!operator) redirect("/operator");
  return operator;
}
