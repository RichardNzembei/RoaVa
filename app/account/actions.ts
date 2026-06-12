"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n";

export type NameState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; message: string };

// Update the signed-in user's display name (RLS scopes to their own profile;
// the role guard blocks anything but name/language here).
export async function updateName(
  _prev: NameState,
  formData: FormData,
): Promise<NameState> {
  const t = await getT();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { status: "error", message: t("err_name_empty") };
  if (name.length > 80) return { status: "error", message: t("err_name_long") };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: t("err_signin_again") };

  const { error } = await supabase.from("profiles").update({ name }).eq("id", user.id);
  if (error) return { status: "error", message: t("err_save_retry") };

  revalidatePath("/account");
  return { status: "saved" };
}
