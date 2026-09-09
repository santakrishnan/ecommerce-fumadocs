import { type ErrorDetail, errorDetailCodeEnum } from "@ucmp/sdk-search-api";

/**
 * Runtime values of the upstream SDK's error code enum — used for membership
 * validation when extracting structured error bodies from upstream responses.
 */
const VALID_ERROR_DETAIL_CODES = new Set<string>(Object.values(errorDetailCodeEnum));

/**
 * Type guard that validates the complete upstream `ErrorDetail` shape:
 *   { code: ErrorDetailCodeEnumKey, message: string }
 *
 * Both `code` membership against the SDK enum AND `message` as a non-empty
 * string are required. An upstream payload that fails either check (e.g.
 * `{ code: "Typo" }` or `{ code: "NotFound", message: undefined }`) returns
 * false, causing the caller to fall through to the HTTP-semantic fallback.
 */
export function isValidErrorDetail(value: unknown): value is ErrorDetail {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.code === "string" &&
    VALID_ERROR_DETAIL_CODES.has(candidate.code) &&
    typeof candidate.message === "string" &&
    candidate.message.length > 0
  );
}
