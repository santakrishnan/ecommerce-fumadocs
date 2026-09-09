import { VERCEL_TOOLBAR_COOKIE } from "@config/vercel-toolbar";
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

describe("setVercelToolbar", () => {
  it.each(["on", "off"])("persists a valid state '%s' to the cookie", async (state) => {
    const { setVercelToolbar } = await import("./set-vercel-toolbar");
    const result = await setVercelToolbar(state);
    expect(result).toEqual({ success: true });
    expect(mockSet).toHaveBeenCalledWith(VERCEL_TOOLBAR_COOKIE, state, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
    });
  });

  it("does not write the cookie for an invalid value", async () => {
    const { setVercelToolbar } = await import("./set-vercel-toolbar");
    const result = await setVercelToolbar("enabled");
    expect(result).toEqual({ success: false });
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("does not write the cookie for an empty string", async () => {
    const { setVercelToolbar } = await import("./set-vercel-toolbar");
    const result = await setVercelToolbar("");
    expect(result).toEqual({ success: false });
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("does not write the cookie for a case-mismatched value", async () => {
    const { setVercelToolbar } = await import("./set-vercel-toolbar");
    const result = await setVercelToolbar("On");
    expect(result).toEqual({ success: false });
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("sets secure:true in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { setVercelToolbar } = await import("./set-vercel-toolbar");
    await setVercelToolbar("on");
    expect(mockSet).toHaveBeenCalledWith(
      VERCEL_TOOLBAR_COOKIE,
      "on",
      expect.objectContaining({ secure: true })
    );
    vi.unstubAllEnvs();
  });
});

describe("resetVercelToolbar", () => {
  it("deletes the vercel toolbar cookie", async () => {
    const { resetVercelToolbar } = await import("./set-vercel-toolbar");
    const result = await resetVercelToolbar();
    expect(result).toEqual({ success: true });
    expect(mockDelete).toHaveBeenCalledWith(VERCEL_TOOLBAR_COOKIE);
  });
});
