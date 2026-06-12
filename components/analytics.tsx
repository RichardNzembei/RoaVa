"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/*
  Privacy-safe, opt-in product analytics (PostHog).

  - INERT until NEXT_PUBLIC_POSTHOG_KEY is set, so there's zero bundle/runtime
    cost (and no tracking) until the owner deliberately enables it. posthog-js is
    dynamically imported only when a key exists — it never lands in the main
    bundle, protecting the low-end-Android performance budget (CLAUDE.md §4.6).
  - Conservative config: no autocapture (so form inputs / PII are never swept up),
    no session recording, respects Do-Not-Track, and creates person profiles only
    if we explicitly identify (we never do — events stay anonymous). This keeps us
    aligned with the Kenya Data Protection Act posture (§11).

  NOTE (owner): enabling analytics in production is a privacy decision — confirm a
  cookie/consent stance and privacy-policy entry before setting the key.
*/
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

type PostHog = import("posthog-js").PostHog;
let phPromise: Promise<PostHog | null> | null = null;

async function getPosthog(): Promise<PostHog | null> {
  if (!KEY || typeof window === "undefined") return null;
  if (!phPromise) {
    phPromise = import("posthog-js").then(({ default: posthog }) => {
      posthog.init(KEY, {
        api_host: HOST,
        capture_pageview: false, // sent manually below (App Router has no full reload)
        capture_pageleave: true,
        autocapture: false, // privacy: explicit events only, never blanket DOM capture
        disable_session_recording: true,
        respect_dnt: true,
        person_profiles: "identified_only", // anonymous events; no profile unless identified
      });
      return posthog;
    });
  }
  return phPromise;
}

/** Fire a domain event (no-op until a key is configured). */
export async function captureEvent(
  name: string,
  props?: Record<string, unknown>,
): Promise<void> {
  const ph = await getPosthog();
  ph?.capture(name, props);
}

// Manual pageview capture on App Router navigations.
export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!KEY) return;
    const qs = searchParams?.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    getPosthog().then((ph) => ph?.capture("$pageview", { $current_url: url }));
  }, [pathname, searchParams]);

  return null;
}
