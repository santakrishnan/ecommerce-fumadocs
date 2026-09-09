// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for POST /api/v1/revalidate — the on-demand cache invalidation endpoint.
 */

describe("POST /api/v1/revalidate", () => {
  beforeEach(() => {
    vi.stubEnv("REVALIDATION_SECRET", "test-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  function createRequest(tag?: string, secret?: string) {
    const params = new URLSearchParams();
    if (tag) {
      params.set("tag", tag);
    }
    if (secret) {
      params.set("secret", secret);
    }
    return new Request(`http://localhost:3000/api/v1/revalidate?${params.toString()}`, {
      method: "POST",
    });
  }

  it("returns 401 when secret is missing", async () => {
    const { POST } = await import("~/app/api/v1/revalidate/route");
    const response = await POST(createRequest("my-tag"));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false, error: "Unauthorized" });
  });

  it("returns 401 when secret is incorrect", async () => {
    const { POST } = await import("~/app/api/v1/revalidate/route");
    const response = await POST(createRequest("my-tag", "wrong-secret"));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false, error: "Unauthorized" });
  });

  it("returns 400 when tag is missing", async () => {
    const { POST } = await import("~/app/api/v1/revalidate/route");
    const response = await POST(createRequest(undefined, "test-secret"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "Missing tag" });
  });

  it("revalidates the tag and returns success", async () => {
    const revalidateTagSpy = vi.fn();
    vi.resetModules();
    vi.doMock("next/cache", () => ({
      revalidateTag: revalidateTagSpy,
    }));

    const revalidateRoute = await import("~/app/api/v1/revalidate/route");
    const response = await revalidateRoute.POST(createRequest("featured-vehicles", "test-secret"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, tag: "featured-vehicles" });
    expect(revalidateTagSpy).toHaveBeenCalledWith("featured-vehicles", "max");
  });
});
