"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeKenyanPhone } from "@/lib/phone";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n";

export type OtpRequestState =
  | { status: "idle" }
  | { status: "sent"; phone: string }
  | { status: "error"; message: string };

export type OtpVerifyState =
  | { status: "idle" }
  | { status: "error"; message: string };

// Step 1 — send the OTP. shouldCreateUser lets a first-time phone sign up
// (the DB trigger then creates their profile).
export async function requestOtp(
  _prev: OtpRequestState,
  formData: FormData,
): Promise<OtpRequestState> {
  const t = await getT();
  const raw = String(formData.get("phone") ?? "");
  const phone = normalizeKenyanPhone(raw);
  if (!phone) {
    return { status: "error", message: t("err_phone_invalid") };
  }

  // Cap OTP sends to protect against SMS-cost abuse (per number and per IP).
  const ip = await clientIp();
  const [byPhone, byIp] = await Promise.all([
    rateLimit(`otp:${phone}`, 5, 900),
    rateLimit(`otp_ip:${ip}`, 20, 900),
  ]);
  if (!byPhone.allowed || !byIp.allowed) {
    return { status: "error", message: t("err_otp_ratelimit") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: true },
  });

  if (error) {
    return { status: "error", message: t("err_otp_send") };
  }

  return { status: "sent", phone };
}

// Step 2 — verify the code. On success the session cookie is set; route the
// user to onboarding until their name is captured, otherwise to `next`/home.
export async function verifyOtp(
  _prev: OtpVerifyState,
  formData: FormData,
): Promise<OtpVerifyState> {
  const t = await getT();
  const phone = String(formData.get("phone") ?? "");
  const token = String(formData.get("token") ?? "").trim();
  const next = String(formData.get("next") ?? "");

  if (!/^\d{4,8}$/.test(token)) {
    return { status: "error", message: t("err_otp_empty") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });

  if (error) {
    return { status: "error", message: t("err_otp_bad") };
  }

  // Decide where to land based on whether the name is set yet.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let hasName = false;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();
    hasName = Boolean(data?.name);
  }

  const safeNext = next.startsWith("/") ? next : "/";
  if (!hasName) {
    redirect(`/onboarding${next ? `?next=${encodeURIComponent(safeNext)}` : ""}`);
  }
  redirect(safeNext);
}
