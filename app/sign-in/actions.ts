"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeKenyanPhone } from "@/lib/phone";
import { rateLimit, clientIp } from "@/lib/rate-limit";

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
  const raw = String(formData.get("phone") ?? "");
  const phone = normalizeKenyanPhone(raw);
  if (!phone) {
    return {
      status: "error",
      message: "Enter a valid Kenyan phone number, e.g. 0712 345 678.",
    };
  }

  // Cap OTP sends to protect against SMS-cost abuse (per number and per IP).
  const ip = await clientIp();
  const [byPhone, byIp] = await Promise.all([
    rateLimit(`otp:${phone}`, 5, 900),
    rateLimit(`otp_ip:${ip}`, 20, 900),
  ]);
  if (!byPhone.allowed || !byIp.allowed) {
    return {
      status: "error",
      message: "Too many code requests. Please wait a few minutes and try again.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: true },
  });

  if (error) {
    return {
      status: "error",
      message:
        "We couldn't send the code. Check the number and try again in a moment.",
    };
  }

  return { status: "sent", phone };
}

// Step 2 — verify the code. On success the session cookie is set; route the
// user to onboarding until their name is captured, otherwise to `next`/home.
export async function verifyOtp(
  _prev: OtpVerifyState,
  formData: FormData,
): Promise<OtpVerifyState> {
  const phone = String(formData.get("phone") ?? "");
  const token = String(formData.get("token") ?? "").trim();
  const next = String(formData.get("next") ?? "");

  if (!/^\d{4,8}$/.test(token)) {
    return { status: "error", message: "Enter the code we sent you." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });

  if (error) {
    return {
      status: "error",
      message: "That code didn't work. Check it or request a new one.",
    };
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
