"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeKenyanPhone } from "@/lib/phone";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n";

export type OtpChannel = "phone" | "email";

export type OtpRequestState =
  | { status: "idle" }
  | { status: "sent"; channel: OtpChannel; identifier: string }
  | { status: "error"; message: string };

export type OtpVerifyState =
  | { status: "idle" }
  | { status: "error"; message: string };

// Basic, permissive email shape check — Supabase does the authoritative one.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Step 1 — send the OTP over the chosen channel. shouldCreateUser lets a
// first-time phone/email sign up (the DB trigger then creates their profile).
export async function requestOtp(
  _prev: OtpRequestState,
  formData: FormData,
): Promise<OtpRequestState> {
  const t = await getT();
  const channel: OtpChannel =
    formData.get("channel") === "email" ? "email" : "phone";
  const ip = await clientIp();

  if (channel === "email") {
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return { status: "error", message: t("err_email_invalid") };
    }

    // Cap sends per address and per IP (email has tight provider rate limits).
    const [byEmail, byIp] = await Promise.all([
      rateLimit(`otp:email:${email}`, 5, 900),
      rateLimit(`otp_ip:${ip}`, 20, 900),
    ]);
    if (!byEmail.allowed || !byIp.allowed) {
      return { status: "error", message: t("err_otp_ratelimit") };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      return { status: "error", message: t("err_otp_send") };
    }
    return { status: "sent", channel: "email", identifier: email };
  }

  // Phone channel.
  const phone = normalizeKenyanPhone(String(formData.get("phone") ?? ""));
  if (!phone) {
    return { status: "error", message: t("err_phone_invalid") };
  }

  // Cap OTP sends to protect against SMS-cost abuse (per number and per IP).
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
  return { status: "sent", channel: "phone", identifier: phone };
}

// Step 2 — verify the code for the chosen channel. On success the session
// cookie is set; route to onboarding until the name is captured, else `next`.
export async function verifyOtp(
  _prev: OtpVerifyState,
  formData: FormData,
): Promise<OtpVerifyState> {
  const t = await getT();
  const channel: OtpChannel =
    formData.get("channel") === "email" ? "email" : "phone";
  const identifier = String(formData.get("identifier") ?? "");
  const token = String(formData.get("token") ?? "").trim();
  const next = String(formData.get("next") ?? "");

  if (!/^\d{4,8}$/.test(token)) {
    return { status: "error", message: t("err_otp_empty") };
  }

  const supabase = await createClient();
  const { error } =
    channel === "email"
      ? await supabase.auth.verifyOtp({
          email: identifier,
          token,
          type: "email",
        })
      : await supabase.auth.verifyOtp({
          phone: identifier,
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
