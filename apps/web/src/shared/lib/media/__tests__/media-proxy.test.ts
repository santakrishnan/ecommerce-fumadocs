// @vitest-environment node
import { proxyMediaRequest } from "@shared/lib/media/media-proxy";
import { afterEach, describe, expect, it, vi } from "vitest";

const BASE_URL = "https://media.sandbox.arrow.toyotafinancial.com";
const KEY = "test-origin-verify-key";
const PATH = "9d15716df6335ec1812b546b68cf9372/012-1b72042e9b9f.jpg";

function configureUpstream(overrides: Record<string, string> = {}): void {
  vi.stubEnv("NEXT_PUBLIC_MEDIA_CDN_URL", BASE_URL);
  vi.stubEnv("HEADER_X_ORIGIN_VERIFY", KEY);
  for (const [name, value] of Object.entries(overrides)) {
    vi.stubEnv(name, value);
  }
}

function mockFetch(response: Response | (() => Promise<Response>)) {
  const impl = typeof response === "function" ? response : () => Promise.resolve(response);
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function mediaRequest(path = PATH, init?: RequestInit): Request {
  return new Request(`http://localhost/api/v1/media/${path}`, init);
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("proxyMediaRequest", () => {
  it("returns 503 when the media upstream is not configured", async () => {
    const response = await proxyMediaRequest(mediaRequest(), PATH.split("/"));
    expect(response.status).toBe(503);
  });

  it("returns 400 for a traversal path and never calls upstream", async () => {
    configureUpstream();
    const fetchMock = mockFetch(new Response("nope"));

    const response = await proxyMediaRequest(mediaRequest(), ["..", "..", "secret"]);

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 400 for an empty path", async () => {
    configureUpstream();
    mockFetch(new Response("nope"));

    const response = await proxyMediaRequest(mediaRequest(), []);
    expect(response.status).toBe(400);
  });

  it("injects X-Origin-Verify, hits the composed URL, and streams the body", async () => {
    configureUpstream();
    const fetchMock = mockFetch(
      new Response("jpeg-bytes", {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      })
    );

    const response = await proxyMediaRequest(mediaRequest(), PATH.split("/"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(await response.text()).toBe("jpeg-bytes");

    const [url, options] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe(`${BASE_URL}/${PATH}`);
    expect(new Headers(options.headers).get("x-origin-verify")).toBe(KEY);
  });

  it("falls back to a public max-age Cache-Control when upstream omits one", async () => {
    configureUpstream({ MEDIA_CACHE_MAX_AGE: "600" });
    mockFetch(new Response("bytes", { status: 200, headers: { "content-type": "image/png" } }));

    const response = await proxyMediaRequest(mediaRequest(), PATH.split("/"));
    expect(response.headers.get("cache-control")).toBe("public, max-age=600");
  });

  it("respects the upstream Cache-Control when present", async () => {
    configureUpstream();
    mockFetch(
      new Response("bytes", {
        status: 200,
        headers: { "content-type": "image/png", "cache-control": "private, max-age=30" },
      })
    );

    const response = await proxyMediaRequest(mediaRequest(), PATH.split("/"));
    expect(response.headers.get("cache-control")).toBe("private, max-age=30");
  });

  it("passes an upstream error status through with no body", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    configureUpstream();
    mockFetch(new Response("forbidden", { status: 403 }));

    const response = await proxyMediaRequest(mediaRequest(), PATH.split("/"));
    expect(response.status).toBe(403);
    expect(await response.text()).toBe("");
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("forwards Range and passes a 206 partial response through", async () => {
    configureUpstream();
    const fetchMock = mockFetch(
      new Response("partial", {
        status: 206,
        headers: { "content-range": "bytes 0-6/100", "accept-ranges": "bytes" },
      })
    );

    const response = await proxyMediaRequest(
      mediaRequest(PATH, { headers: { range: "bytes=0-6" } }),
      PATH.split("/")
    );

    expect(response.status).toBe(206);
    expect(response.headers.get("content-range")).toBe("bytes 0-6/100");
    const [, options] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(new Headers(options.headers).get("range")).toBe("bytes=0-6");
  });

  it("returns 504 when the upstream fetch aborts (timeout)", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    configureUpstream();
    mockFetch(() => Promise.reject(new DOMException("aborted", "AbortError")));

    const response = await proxyMediaRequest(mediaRequest(), PATH.split("/"));
    expect(response.status).toBe(504);
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("returns 502 when the upstream connection fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    configureUpstream();
    mockFetch(() => Promise.reject(new TypeError("network down")));

    const response = await proxyMediaRequest(mediaRequest(), PATH.split("/"));
    expect(response.status).toBe(502);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("issues a bodyless HEAD upstream and returns no body", async () => {
    configureUpstream();
    const fetchMock = mockFetch(
      new Response(null, { status: 200, headers: { "content-length": "1024" } })
    );

    const response = await proxyMediaRequest(
      mediaRequest(PATH, { method: "HEAD" }),
      PATH.split("/")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-length")).toBe("1024");
    expect(await response.text()).toBe("");
    const [, options] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(options.method).toBe("HEAD");
  });
});
