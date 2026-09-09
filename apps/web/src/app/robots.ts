import { clientEnv } from "@config/client-env";
import type { MetadataRoute } from "next";

const SITE_URL = clientEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Override the base URL with `NEXT_PUBLIC_SITE_URL`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Lock down everything under `/api` and never index Server Action endpoints.
        disallow: ["/api/", "/_next/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
