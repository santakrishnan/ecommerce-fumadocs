// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildTrackingHeaders, ClientHttpError, createHttpClient } from "../client-api";

function makeJsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createHttpClient — success path", () => {
  it("returns parsed JSON for 200", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({ ok: true }));
    const client = createHttpClient({}, {}, { baseUrl: "/api" });
    const result = await client.get<{ ok: boolean }>("/x");
    expect(result).toEqual({ ok: true });
  });

  it("returns undefined for 204", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = createHttpClient({}, {}, { baseUrl: "/api" });
    const result = await client.delete("/x");
    expect(result).toBeUndefined();
  });

  it("sends credentials: 'include' by default", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({}));
    const client = createHttpClient({}, {}, { baseUrl: "/api" });
    await client.get("/x");
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.credentials).toBe("include");
  });

  it("respects per-request credentials override", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({}));
    const client = createHttpClient({}, {}, { baseUrl: "/api" });
    await client.get("/x", { credentials: "omit" });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.credentials).toBe("omit");
  });
});

describe("createHttpClient — tracking headers", () => {
  it("injects tracking IDs via headerMap", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({}));
    const client = createHttpClient(
      { sessionId: "s1", profileId: null },
      { sessionId: "X-Session-Id", profileId: "X-Profile-Id" },
      { baseUrl: "/api" }
    );
    await client.get("/x");
    const headers = (fetchMock.mock.calls[0]?.[1] as RequestInit).headers as Headers;
    expect(headers.get("X-Session-Id")).toBe("s1");
    expect(headers.has("X-Profile-Id")).toBe(false);
  });

  it("buildTrackingHeaders mirrors the same behaviour", () => {
    const headers = buildTrackingHeaders(
      { sessionId: "s1", profileId: null },
      { sessionId: "X-Session-Id", profileId: "X-Profile-Id" }
    );
    expect(headers).toEqual({ "X-Session-Id": "s1" });
  });
});

describe("createHttpClient — retry policy", () => {
  it("retries idempotent GET on 503", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("boom", { status: 503 }))
      .mockResolvedValueOnce(makeJsonResponse({ ok: true }));
    const client = createHttpClient({}, {}, { baseUrl: "/api", retries: 1, retryDelay: 1 });
    const result = await client.get("/x");
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry POST on 503 by default", async () => {
    fetchMock.mockResolvedValueOnce(new Response("boom", { status: 503 }));
    const client = createHttpClient({}, {}, { baseUrl: "/api", retries: 3, retryDelay: 1 });
    await expect(client.post("/x", { a: 1 })).rejects.toBeInstanceOf(ClientHttpError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries POST with idempotent: true", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("boom", { status: 503 }))
      .mockResolvedValueOnce(makeJsonResponse({ ok: true }));
    const client = createHttpClient({}, {}, { baseUrl: "/api", retries: 1, retryDelay: 1 });
    const result = await client.post("/x", { a: 1 }, { idempotent: true });
    expect(result).toEqual({ ok: true });
  });
});

describe("createHttpClient — errors", () => {
  it("wraps fetch rejection as NETWORK_ERROR", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const client = createHttpClient({}, {}, { baseUrl: "/api", retries: 0 });
    const err = (await client.get("/x").catch((e: unknown) => e)) as ClientHttpError;
    expect(err).toBeInstanceOf(ClientHttpError);
    expect(err.code).toBe("NETWORK_ERROR");
  });

  it("wraps AbortError as TIMEOUT", async () => {
    const abort = new Error("aborted");
    abort.name = "AbortError";
    fetchMock.mockRejectedValueOnce(abort);
    const client = createHttpClient({}, {}, { baseUrl: "/api", retries: 0 });
    const err = (await client.get("/x").catch((e: unknown) => e)) as ClientHttpError;
    expect(err.code).toBe("TIMEOUT");
  });

  it("does not double-read the response body on JSON-parse failure", async () => {
    fetchMock.mockResolvedValueOnce(new Response("not-json", { status: 500 }));
    const client = createHttpClient({}, {}, { baseUrl: "/api", retries: 0 });
    const err = (await client.get("/x").catch((e: unknown) => e)) as ClientHttpError;
    expect(err.status).toBe(500);
    expect(err.body).toBe("not-json");
  });
});

describe("createHttpClient — schema, params, body, encryption guard", () => {
  it("validates response via schema", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({ id: "x" }));
    const client = createHttpClient({}, {}, { baseUrl: "/api" });
    const err = (await client
      .get("/x", {
        schema: {
          parse: (v) => {
            if (typeof (v as { id: unknown }).id !== "number") {
              throw new Error("bad");
            }
            return v as { id: number };
          },
        },
      })
      .catch((e: unknown) => e)) as ClientHttpError;
    expect(err.code).toBe("SCHEMA_VALIDATION");
  });

  it("appends query params", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({}));
    const client = createHttpClient({}, {}, { baseUrl: "/api" });
    await client.get("/q", { params: { tag: ["a", "b"], page: 1 } });
    const url = fetchMock.mock.calls[0]?.[0] as string;
    const parsed = new URL(url, "http://example.com");
    expect(parsed.searchParams.getAll("tag")).toEqual(["a", "b"]);
    expect(parsed.searchParams.get("page")).toBe("1");
  });

  it("passes FormData through without setting Content-Type", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({}));
    const client = createHttpClient({}, {}, { baseUrl: "/api" });
    const form = new FormData();
    form.append("file", new Blob(["x"]), "x.txt");
    await client.post("/upload", form);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.has("Content-Type")).toBe(false);
    expect(init.body).toBe(form);
  });

  it("rejects encrypt: true with non-JSON bodies", async () => {
    const client = createHttpClient({}, {}, { baseUrl: "/api" });
    const form = new FormData();
    await expect(client.post("/x", form, { encrypt: true })).rejects.toMatchObject({
      code: "ENCRYPTION_INVALID_BODY",
    });
  });

  it("rejects encrypt: true when no key is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENCRYPTION_KEY", "");
    vi.stubEnv("ENCRYPTION_KEY", "");
    try {
      const client = createHttpClient({}, {}, { baseUrl: "/api" });
      await expect(client.post("/x", { a: 1 }, { encrypt: true })).rejects.toMatchObject({
        code: "ENCRYPTION_KEY_MISSING",
      });
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
