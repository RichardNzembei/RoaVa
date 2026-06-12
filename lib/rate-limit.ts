import "server-only";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";

// Fixed-window rate limit backed by Postgres (check_rate_limit). Fails OPEN:
// if the limiter itself errors we allow the action rather than block real users.
export async function rateLimit(
  key: string,
  max: number,
  windowSeconds: number,
): Promise<{ allowed: boolean }> {
  try {
    const service = createServiceClient();
    const { data, error } = await service.rpc("check_rate_limit", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) return { allowed: true };
    return { allowed: data !== false };
  } catch {
    return { allowed: true };
  }
}

// Best-effort client IP from proxy headers (Vercel sets x-forwarded-for).
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
