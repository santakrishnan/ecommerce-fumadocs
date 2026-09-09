// @vitest-environment node
import { PROFILE_TIER_COOKIE } from "@config/profile-tier";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const { mockCookies, mockSet, mockDelete } = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockSet: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

beforeEach(() => {
  vi.resetModules();
  mockSet.mockReset();
  mockDelete.mockReset();
  mockCookies.mockResolvedValue({ set: mockSet, delete: mockDelete });
});

afterEach(() => {
  vi.resetModules();
});

describe("setProfileTier", () => {
  it.each(["t0", "t1", "t2", "t3"])("persists a valid tier '%s' to the cookie", async (tier) => {
    const { setProfileTier } = await import("./set-profile-tier");
    const result = await setProfileTier(tier);
    expect(result).toEqual({ success: true });
    expect(mockSet).toHaveBeenCalledWith(PROFILE_TIER_COOKIE, tier, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
    });
  });

  it("does not write the cookie for an invalid value", async () => {
    const { setProfileTier } = await import("./set-profile-tier");
    const result = await setProfileTier("t4");
    expect(result).toEqual({ success: false });
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("does not write the cookie for an empty string", async () => {
    const { setProfileTier } = await import("./set-profile-tier");
    const result = await setProfileTier("");
    expect(result).toEqual({ success: false });
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("does not write the cookie for a case-mismatched value", async () => {
    const { setProfileTier } = await import("./set-profile-tier");
    const result = await setProfileTier("T1");
    expect(result).toEqual({ success: false });
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("sets secure:true and the __Host- prefixed name in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { setProfileTier } = await import("./set-profile-tier");
    const { PROFILE_TIER_COOKIE: prodCookieName } = await import("@config/profile-tier");
    await setProfileTier("t2");
    expect(mockSet).toHaveBeenCalledWith(
      prodCookieName,
      "t2",
      expect.objectContaining({ secure: true })
    );
    vi.unstubAllEnvs();
  });
});

describe("resetProfileTier", () => {
  it("deletes the profile tier cookie", async () => {
    const { resetProfileTier } = await import("./set-profile-tier");
    const { PROFILE_TIER_COOKIE: currentCookieName } = await import("@config/profile-tier");
    const result = await resetProfileTier();
    expect(result).toEqual({ success: true });
    expect(mockDelete).toHaveBeenCalledWith(currentCookieName);
  });
});
