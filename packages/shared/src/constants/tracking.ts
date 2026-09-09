/**
 * Tracking constants — cookie names, header names, and TTLs.
 *
 * Centralised so that every place that reads or writes a tracking cookie
 * (proxy, route handlers, services, the HTTP client's `headerMap`) refers
 * to the same string. Changing a cookie name is then a one-file edit.
 *
 * Scoping notes
 * - Cookie values use the `_ucmp_` prefix so they don't collide with
 *   third-party cookies on the same domain. Replace the prefix when you
 *   rebrand the scaffolding (single search/replace).
 * - Header names follow `X-<Brand>-<Purpose>` to stay grep-friendly in
 *   server logs and traces.
 * - TTLs are stored in **seconds** to match the Set-Cookie `Max-Age`
 *   convention. Convert to milliseconds at the call site when comparing
 *   against `Date.now()`.
 */

export const TRACKING_COOKIE = {
  /** Long-lived visitor session id (90d). Drives the returning-visitor redirect. */
  SESSION_ID: "_ucmp_session_id",
  /** Canonical visitor id resolved by the profile service. */
  VISITOR_ID: "_ucmp_visitor_id",
  /** Device / browser fingerprint id (24h). */
  FP_ID: "_ucmp_fp_id",
  /** Authenticated user profile id (24h). Absent for anonymous traffic. */
  PROFILE_ID: "_ucmp_profile_id",
  /** Per-event fingerprint correlation id (24h). */
  FP_EID: "_ucmp_fp_eid",
  /** Unix-ms timestamp of the visitor's first landing. Used by proxy.ts to determine returning-visitor threshold. */
  FIRST_VISIT_AT: "_ucmp_first_visit_at",
  /** ISO timestamp of the visitor's most recent resolved profile visit. */
  LAST_VISIT_AT: "_ucmp_last_visit_at",
  /**
   * Presence flag set by `/demo-settings` visitor generation. No max-age —
   * persists until explicitly cleared.
   * While the cookie exists → show fresh-visit experience (recent-return blocked).
   * Cleared on VDP visit (see `unblockRecentReturn`) → show recent-return experience.
   */
  RECENT_RETURN_BLOCKED: "_ucmp_recent_return_blocked",
} as const;

export const TRACKING_HEADER = {
  SESSION_ID: "X-Ucmp-Session-Id",
  FP_ID: "X-Ucmp-Fp-Id",
  PROFILE_ID: "X-Ucmp-Profile-Id",
  FP_EID: "X-Ucmp-Fp-Eid",
} as const;

/** TTLs in **seconds** (Set-Cookie Max-Age convention). */
export const TRACKING_TTL = {
  /** 90 days — matches the returning-visitor window. */
  SESSION: 90 * 86_400,
  /** 24 hours. */
  FINGERPRINT: 86_400,
  /** 24 hours. */
  PROFILE: 86_400,
  /** 24 hours. */
  EVENT: 86_400,
  /** 30 days — cookie expiry for the FIRST_VISIT_AT cookie. */
  RETURNING_VISITOR: 30 * 86_400,
  /** 2 hours — time that must pass before a visitor is treated as "returning" (welcome page). */
  RETURNING_VISITOR_THRESHOLD: 2 * 3600,
} as const;

/**
 * Convenience pairing for `extractTrackingIds()` and the HTTP client's
 * `headerMap` config — purpose-key → header / cookie name. Always change
 * both ends together if you rename a purpose.
 */
export const TRACKING_HEADER_MAP = {
  sessionId: TRACKING_HEADER.SESSION_ID,
  fingerprintId: TRACKING_HEADER.FP_ID,
  profileId: TRACKING_HEADER.PROFILE_ID,
  eventId: TRACKING_HEADER.FP_EID,
} as const;

export const TRACKING_COOKIE_MAP = {
  sessionId: TRACKING_COOKIE.SESSION_ID,
  fingerprintId: TRACKING_COOKIE.FP_ID,
  profileId: TRACKING_COOKIE.PROFILE_ID,
  eventId: TRACKING_COOKIE.FP_EID,
} as const;

export type TrackingCookieName = (typeof TRACKING_COOKIE)[keyof typeof TRACKING_COOKIE];
export type TrackingHeaderName = (typeof TRACKING_HEADER)[keyof typeof TRACKING_HEADER];
export type TrackingPurpose = keyof typeof TRACKING_HEADER_MAP;
