import { clientEnvSchema } from "./env-schema";

// NEXT_PUBLIC_* vars must be referenced via explicit property access so the
// Next.js bundler can statically inline them into the client bundle.
// Do NOT use dynamic key lookups (process.env[key]) for these vars.
const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_MEDIA_CDN_URL: process.env.NEXT_PUBLIC_MEDIA_CDN_URL,
  NEXT_PUBLIC_IMAGE_BASE_URL: process.env.NEXT_PUBLIC_IMAGE_BASE_URL,
  NEXT_PUBLIC_FINGERPRINT_API_KEY: process.env.NEXT_PUBLIC_FINGERPRINT_API_KEY,
  NEXT_PUBLIC_FINGERPRINT_REGION: process.env.NEXT_PUBLIC_FINGERPRINT_REGION,
  NEXT_PUBLIC_MOCKS: process.env.NEXT_PUBLIC_MOCKS,
  NEXT_PUBLIC_PASSKEY_API_BASE: process.env.NEXT_PUBLIC_PASSKEY_API_BASE,
  NEXT_PUBLIC_SEARCH_RECS_LIMIT: process.env.NEXT_PUBLIC_SEARCH_RECS_LIMIT,
  NEXT_PUBLIC_ENCRYPTION_KEY: process.env.NEXT_PUBLIC_ENCRYPTION_KEY,
});

if (!parsed.success) {
  const lines = parsed.error.issues.map((issue) => `  ${issue.path.join(".")}: ${issue.message}`);
  throw new Error(
    `Invalid client environment variables:\n${lines.join("\n")}\n\nFix the above in .env.local (local) or the Vercel dashboard (production).`
  );
}

/**
 * Typed, validated public (NEXT_PUBLIC_*) environment variables.
 *
 * Safe to import from both Server Components and Client Components.
 * For server-only vars use `env` from `@config/env` instead.
 *
 * @example
 * import { clientEnv } from "@config/client-env";
 * const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL;
 */
export const clientEnv = parsed.data;
