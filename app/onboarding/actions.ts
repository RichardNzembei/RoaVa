"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type NameState = { status: "idle" } | { status: "error"; message: string };

export async function saveName(
  _prev: NameState,
  formData: FormData,
): Promise<NameState> {
  const name = String(formData.get("name") ?? "").trim();
  const next = String(formData.get("next") ?? "");

  if (name.length < 2) {
    return { status: "error", message: "Please enter your name." };
  }
  if (name.length > 80) {
    return { status: "error", message: "That name is a little too long." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // RLS allows a user to update only their own profile; name is unguarded.
  const { error } = await supabase
    .from("profiles")
    .update({ name })
    .eq("id", user.id);

  if (error) {
    return {
      status: "error",
      message: "We couldn't save that. Please try again.",
    };
  }

  redirect(next.startsWith("/") ? next : "/");
}
