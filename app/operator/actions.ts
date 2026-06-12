"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getT } from "@/lib/i18n";

export type BecomeOperatorState =
  | { status: "idle" }
  | { status: "error"; message: string };

// Promotes the current consumer to an operator: creates their operator row and
// flips their role. The role change is admin/service-only (guarded in SQL), so
// this runs with the service client. Idempotent if called twice.
export async function becomeOperator(
  _prev: BecomeOperatorState,
  formData: FormData,
): Promise<BecomeOperatorState> {
  const t = await getT();
  const businessName = String(formData.get("business_name") ?? "").trim();
  if (businessName.length < 2) {
    return { status: "error", message: t("err_biz_empty") };
  }
  if (businessName.length > 120) {
    return { status: "error", message: t("err_biz_long") };
  }

  // Identify the user under their own session (never trust a client-sent id).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/operator");

  const service = createServiceClient();

  // Already an operator? Just ensure role + land on the dashboard.
  const { data: existing } = await service
    .from("operators")
    .select("id")
    .eq("owner_profile_id", user.id)
    .maybeSingle();

  if (!existing) {
    const { error: insertError } = await service
      .from("operators")
      .insert({ owner_profile_id: user.id, business_name: businessName });
    if (insertError) {
      return { status: "error", message: t("err_op_setup") };
    }
  }

  const { error: roleError } = await service
    .from("profiles")
    .update({ role: "operator" })
    .eq("id", user.id);
  if (roleError) {
    return { status: "error", message: t("err_op_finish") };
  }

  redirect("/operator");
}
