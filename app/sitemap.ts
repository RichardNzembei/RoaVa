import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

// Public, indexable routes + every published experience.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.siteUrl;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/discover`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/experiences`, changeFrequency: "daily", priority: 0.8 },
  ];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("experiences")
      .select("id, updated_at")
      .eq("status", "published");

    const experienceRoutes: MetadataRoute.Sitemap = (data ?? []).map((e) => ({
      url: `${base}/experiences/${e.id}`,
      lastModified: e.updated_at ?? undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...experienceRoutes];
  } catch {
    return staticRoutes;
  }
}
