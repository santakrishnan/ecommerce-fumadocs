import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import { clientEnvSchema, serverEnvSchema } from "./src/config/env-schema";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Design-system documentation routes (`/docs`, `/preview`, `/api/docs-search`)
 * are files named `page.docs.tsx` / `route.docs.ts`. They only become routes
 * when the `docs.*` extensions are in `pageExtensions`:
 *   - always in `next dev`
 *   - in `next build` only with ENABLE_DOCS=true (`pnpm build:docs`)
 * A plain `pnpm build` ships the product without any docs code or content.
 */
const docsEnabled = !isProduction || process.env.ENABLE_DOCS === "true";

const fullEnvSchema = serverEnvSchema.merge(clientEnvSchema);
const parsedEnv = fullEnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const errors = parsedEnv.error.issues
    .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  console.error(`\nMissing or invalid environment variables:\n\n${errors}\n`);
  console.error("Add the missing values to .env.local or the Vercel dashboard.\n");
  throw new Error("Build aborted: invalid environment variables.");
}

const nextConfig: NextConfig = {
  pageExtensions: docsEnabled ? ["docs.tsx", "docs.ts", "tsx", "ts"] : ["tsx", "ts"],
  cacheComponents: true,
  partialPrefetching: true,
  cacheLife: {
    /**
     * Landing-style pages with long stale windows.
     * 15-min stale, 15-min revalidation, 1-hour hard expiry.
     */
    landing: { stale: 900, revalidate: 900, expire: 3600 },
    /**
     * User-personalized data — short stale window for fresher results.
     * 5-min stale, 10-min revalidation, 1-hour hard expiry.
     */
    profile: { stale: 300, revalidate: 600, expire: 3600 },
    /** Product detail pages — short cache for changing inventory. */
    detail: { stale: 300, revalidate: 300, expire: 3600 },
    /** Search results pages. */
    search: { stale: 300, revalidate: 300, expire: 3600 },
  },
  // TEMPORARY: local-linked package during sdk-search-api install/build issues.
  // Remove "@ucmp/sdk-search-api" from this list once the package is stable and consumed normally.
  transpilePackages: [
    "@ucmp/ui",
    "@ucmp/ui-theme",
    "@ucmp/shared",
    "utils",
    "@ucmp/sdk-search-api",
  ],
  poweredByHeader: false,
  reactCompiler: true,
  experimental: {
    cachedNavigations: true,
    turbopackRustReactCompiler: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      ...(isProduction
        ? []
        : [
            {
              protocol: "http" as const,
              hostname: "localhost",
              port: "3000",
            },
          ]),
      {
        protocol: "https",
        hostname: "cdnrs.inventoryrsc.com",
      },
      {
        protocol: "https",
        hostname: "cdn.inventoryrsc.com",
      },
      {
        protocol: "https",
        hostname: "tmna.aemassets.toyota.com",
      },
      {
        protocol: "https",
        hostname: "cdn.car-cutter.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.sandbox.arrow.toyotafinancial.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.arrow.toyotafinancial.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

// Inlined at build time so app code can hide docs entry points when absent.
nextConfig.env = { ...nextConfig.env, NEXT_PUBLIC_DOCS_ENABLED: String(docsEnabled) };

export default docsEnabled ? createMDX()(nextConfig) : nextConfig;
