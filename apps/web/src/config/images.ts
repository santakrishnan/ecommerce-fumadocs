import { clientEnv } from "./client-env";

/**
 * Shared image base URL derived from `NEXT_PUBLIC_IMAGE_BASE_URL`.
 *
 * - Trailing slashes are stripped so consumers can safely concatenate paths:
 *     `${IMAGE_BASE_URL}/images/foo.png`
 * - Falls back to an empty string when the env var is unset **or empty**,
 *   producing same-origin relative paths (e.g. `/images/foo.png`) that work
 *   in any deployment without environment-specific configuration.
 */
export const IMAGE_BASE_URL = clientEnv.NEXT_PUBLIC_IMAGE_BASE_URL?.replace(/\/+$/, "") ?? "";
