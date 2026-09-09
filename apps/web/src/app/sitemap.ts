import { clientEnv } from "@config/client-env";
import { ROUTES } from "@config/routes/constants";
import type { MetadataRoute } from "next";

const SITE_URL = clientEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Static sitemap covering the always-known routes.
 * Override the base URL with `NEXT_PUBLIC_SITE_URL`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${SITE_URL}${ROUTES.HOME}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}${ROUTES.WELCOME}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}${ROUTES.SEARCH}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
}
