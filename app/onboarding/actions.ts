"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n";

export type NameState = { status: "idle" } | { status: "error"; message: string };

export async function saveName(
  _prev: NameState,
  formData: FormData,
): Promise<NameState> {
  const t = await getT();
  const name = String(formData.get("name") ?? "").trim();
  const next = String(formData.get("next") ?? "");

  if (name.length < 2) {
    return { status: "error", message: t("err_name_empty") };
  }
  if (name.length > 80) {
    return { status: "error", message: t("err_name_long") };
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
    return { status: "error", message: t("err_save_retry") };
  }

  redirect(next.startsWith("/") ? next : "/");
}
