import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

// Index the public discovery surfaces; keep private/account/operator/payment
// routes out of search.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account",
        "/tickets",
        "/bookings",
        "/operator",
        "/onboarding",
        "/sign-in",
        "/api/",
      ],
    },
    sitemap: `${publicEnv.siteUrl}/sitemap.xml`,
  };
}
