// @vitest-environment node
import { PROFILE_TIER_COOKIE } from "@config/profile-tier";
import { TRACKING_COOKIE } from "@ucmp/shared/constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SYNTHETIC_ID_PREFIX_PATTERN = /^demo_/;

// ── next/headers mock ────────────────────────────────────────────────────────
const { mockCookies, mockCookieSet, mockCookieDelete } = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockCookieSet: vi.fn(),
  mockCookieDelete: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

// ── Shared module mocks ──────────────────────────────────────────────────────
vi.mock("@shared/lib/http", () => ({
  buildCookieConfig: (_name: string, _ttl: number, opts: object) => ({
    name: _name,
    maxAge: _ttl,
    ...opts,
  }),
}));

vi.mock("@features/fingerprint/bff/fingerprint-cookie", () => ({
  encodeVisitorId: (id: string) => `encoded:${id}`,
}));

beforeEach(() => {
  vi.resetModules();
  mockCookieSet.mockReset();
  mockCookieDelete.mockReset();
  mockCookies.mockResolvedValue({ set: mockCookieSet, delete: mockCookieDelete });
});

afterEach(() => {
  vi.resetModules();
});

describe("generateVisitorIdentity — profile tier cookie preservation", () => {
  it("does NOT delete the profile-tier cookie when generating a new visitor identity", async () => {
    const { generateVisitorIdentity } = await import("./reset-visitor-identity");
    await generateVisitorIdentity();

    const deletedCookieNames: string[] = mockCookieDelete.mock.calls.map(
      (call) => call[0] as string
    );
    expect(deletedCookieNames).not.toContain(PROFILE_TIER_COOKIE);
  });

  it("only deletes the expected identity/session tracking cookies", async () => {
    const { generateVisitorIdentity } = await import("./reset-visitor-identity");
    await generateVisitorIdentity();

    const deletedCookieNames: string[] = mockCookieDelete.mock.calls.map(
      (call) => call[0] as string
    );
    const expectedDeleted = [
      TRACKING_COOKIE.VISITOR_ID,
      TRACKING_COOKIE.SESSION_ID,
      TRACKING_COOKIE.PROFILE_ID,
      TRACKING_COOKIE.FP_EID,
      TRACKING_COOKIE.FIRST_VISIT_AT,
      TRACKING_COOKIE.LAST_VISIT_AT,
    ];

    for (const name of expectedDeleted) {
      expect(deletedCookieNames).toContain(name);
    }
    // Exactly those — no extras (like profile-tier or agent-backend)
    expect(deletedCookieNames).toHaveLength(expectedDeleted.length);
  });

  it("returns a successful result with a synthetic ID when a profile-tier cookie is pre-set", async () => {
    // Simulate a profile-tier cookie being present in the store (it should be left untouched)
    mockCookies.mockResolvedValue({
      set: mockCookieSet,
      delete: mockCookieDelete,
      get: (name: string) => (name === PROFILE_TIER_COOKIE ? { value: "t2" } : undefined),
    });

    const { generateVisitorIdentity } = await import("./reset-visitor-identity");
    const result = await generateVisitorIdentity();

    expect(result.success).toBe(true);
    expect(result.syntheticId).toMatch(SYNTHETIC_ID_PREFIX_PATTERN);
    expect(mockCookieDelete).not.toHaveBeenCalledWith(PROFILE_TIER_COOKIE);
  });
});
