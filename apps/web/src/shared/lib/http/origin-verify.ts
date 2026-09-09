import "server-only";

import { env } from "@config/env";

/**
 * Origin-verify header — lets a request pass the Arrow edge (WAF) into the
 * backend APIs. Every outbound call to an Arrow host must carry it.
 *
 * The value is server-only config (`HEADER_X_ORIGIN_VERIFY`, never
 * `NEXT_PUBLIC_*`) and is absent in local dev, so the header is omitted rather
 * than sent empty.
 *
 * This is the single source of truth for both the header name and the env var:
 * call `originVerifyHeader()` at every Arrow call site instead of hand-writing
 * the `process.env` lookup (which is how a transposed env-var name once slipped
 * the header off the search upstream entirely).
 */
export const ORIGIN_VERIFY_HEADER = "X-Origin-Verify";

/**
 * Returns the origin-verify header as a spreadable object, or `{}` when
 * `HEADER_X_ORIGIN_VERIFY` is unset (e.g. local dev). Safe to spread into any
 * headers literal or pass as `defaultHeaders`.
 *
 * Reads `process.env` at call time (not module load) so the value tracks the
 * runtime environment. `process.env` is allowed inside a `"use cache"` scope —
 * only `cookies()` / `headers()` / `searchParams` are not.
 */
export function originVerifyHeader(): Record<string, string> {
  const value = env.HEADER_X_ORIGIN_VERIFY;
  return value ? { [ORIGIN_VERIFY_HEADER]: value } : {};
}
