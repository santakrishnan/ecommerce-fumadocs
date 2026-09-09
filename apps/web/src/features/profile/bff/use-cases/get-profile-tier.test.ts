// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockCookies, mockGet } = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockGet: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

beforeEach(() => {
  vi.resetModules();
  mockGet.mockReset();
  mockGet.mockReturnValue(undefined);
  mockCookies.mockResolvedValue({ get: mockGet });
});

afterEach(() => {
  vi.resetModules();
});

describe("getProfileTier", () => {
  it("returns the default tier when no cookie is set", async () => {
    const { getProfileTier } = await import("./get-profile-tier");
    expect(await getProfileTier()).toBe("t0");
  });

  it.each(["t0", "t1", "t2", "t3"] as const)("returns '%s' when cookie is '%s'", async (tier) => {
    mockGet.mockReturnValue({ value: tier });
    const { getProfileTier } = await import("./get-profile-tier");
    expect(await getProfileTier()).toBe(tier);
  });

  it("returns the default when the cookie value is invalid (garbage string)", async () => {
    mockGet.mockReturnValue({ value: "not-a-tier" });
    const { getProfileTier } = await import("./get-profile-tier");
    expect(await getProfileTier()).toBe("t0");
  });

  it("returns the default when the cookie value is empty string", async () => {
    mockGet.mockReturnValue({ value: "" });
    const { getProfileTier } = await import("./get-profile-tier");
    expect(await getProfileTier()).toBe("t0");
  });

  it("returns the default when the cookie value is a case-mismatched tier (e.g. 'T1')", async () => {
    mockGet.mockReturnValue({ value: "T1" });
    const { getProfileTier } = await import("./get-profile-tier");
    expect(await getProfileTier()).toBe("t0");
  });

  it("returns the default when the cookie value is a stale out-of-range value (e.g. 't4')", async () => {
    mockGet.mockReturnValue({ value: "t4" });
    const { getProfileTier } = await import("./get-profile-tier");
    expect(await getProfileTier()).toBe("t0");
  });

  it("does not throw for any invalid cookie value", async () => {
    mockGet.mockReturnValue({ value: "'; DROP TABLE users; --" });
    const { getProfileTier } = await import("./get-profile-tier");
    await expect(getProfileTier()).resolves.toBe("t0");
  });
});
