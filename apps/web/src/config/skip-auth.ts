import { buildCookieConfig } from "@shared/lib/http/sealed-cookie";
import { z } from "zod";

/**
 * Skip-auth demo override — cookie contract + option metadata. Non-httpOnly so
 * the client visitor check (readVisitorAuth) can read it via document.cookie.
 * Default "true" → visitor treated as verified (gates off, matches develop);
 * "false" → anonymous (gates fire).
 */

const SKIP_AUTH_COOKIE_TTL = 60 * 60 * 24 * 365;

export const skipAuthCookie = buildCookieConfig("demo-skip-auth", SKIP_AUTH_COOKIE_TTL, {
  httpOnly: false,
  sameSite: "lax",
});

export const SKIP_AUTH_COOKIE = skipAuthCookie.name;

export const skipAuthSchema = z.enum(["true", "false"]);

export type SkipAuth = z.infer<typeof skipAuthSchema>;

export const DEFAULT_SKIP_AUTH: SkipAuth = "true";
