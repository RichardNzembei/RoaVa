"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireOperator } from "@/lib/auth";
import { EXPERIENCE_IMAGES_BUCKET } from "@/lib/storage";
import { getT } from "@/lib/i18n";

const MAX_IMAGES = 8;

// Attach an already-uploaded object key to the experience's image list. The
// upload itself happens client-side under storage RLS; this records the key.
export async function attachImage(experienceId: string, objectKey: string) {
  const operator = await requireOperator();
  const t = await getT();
  // Defend the path convention: key must live under this operator's folder.
  if (!objectKey.startsWith(`${operator.id}/${experienceId}/`)) {
    return { ok: false as const, message: t("err_img_path") };
  }

  const supabase = await createClient();
  const { data: exp } = await supabase
    .from("experiences")
    .select("images")
    .eq("id", experienceId)
    .maybeSingle();
  if (!exp) return { ok: false as const, message: t("err_exp_notfound") };

  const images = exp.images ?? [];
  if (images.includes(objectKey)) return { ok: true as const };
  if (images.length >= MAX_IMAGES) {
    return { ok: false as const, message: t("err_img_max").replace("{n}", String(MAX_IMAGES)) };
  }

  const { error } = await supabase
    .from("experiences")
    .update({ images: [...images, objectKey] })
    .eq("id", experienceId);
  if (error) return { ok: false as const, message: t("err_img_save") };

  revalidatePath(`/operator/experiences/${experienceId}`);
  return { ok: true as const };
}

// Remove an image from the list and delete the stored object.
export async function removeImage(experienceId: string, objectKey: string) {
  await requireOperator();
  const supabase = await createClient();

  const { data: exp } = await supabase
    .from("experiences")
    .select("images")
    .eq("id", experienceId)
    .maybeSingle();
  if (!exp) return;

  const next = (exp.images ?? []).filter((k) => k !== objectKey);
  await supabase
    .from("experiences")
    .update({ images: next })
    .eq("id", experienceId);

  // RLS on storage.objects allows the owning operator to delete.
  await supabase.storage.from(EXPERIENCE_IMAGES_BUCKET).remove([objectKey]);

  revalidatePath(`/operator/experiences/${experienceId}`);
}
