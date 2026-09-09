// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServerClient, ServerHttpError } from "../server-api";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

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

describe("createServerClient — success path", () => {
  it("returns parsed JSON for 200", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({ id: 1, name: "X" }));

    const client = createServerClient({ baseUrl: "https://api.test" });
    const result = await client.get<{ id: number; name: string }>("/items/1");
    expect(result).toEqual({ id: 1, name: "X" });
  });

  it("returns undefined for 204", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    const client = createServerClient({ baseUrl: "https://api.test" });
    const result = await client.delete("/items/1");
    expect(result).toBeUndefined();
  });

  it("defaults cache to 'no-store' (Next 16 explicit caching)", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({}));
    const client = createServerClient({ baseUrl: "https://api.test" });
    await client.get("/x");
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.cache).toBe("no-store");
  });

  it("honours per-request cache override and next options", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({}));
    const client = createServerClient({ baseUrl: "https://api.test" });
    await client.get("/x", { cache: "force-cache", next: { revalidate: 60, tags: ["x"] } });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit & { next?: { revalidate: number } };
    expect(init.cache).toBe("force-cache");
    expect(init.next).toEqual({ revalidate: 60, tags: ["x"] });
  });
});

describe("createServerClient — auth + tracking", () => {
  it("attaches Authorization from a static token", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({}));
    const client = createServerClient({ baseUrl: "https://api.test", authToken: "abc" });
    await client.get("/x");
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer abc");
  });

  it("invokes a dynamic auth-token function on every attempt", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(makeJsonResponse({ ok: true }));

    const getToken = vi.fn().mockReturnValueOnce("t1").mockReturnValueOnce("t2");
    const client = createServerClient({
      baseUrl: "https://api.test",
      authToken: getToken,
      retries: 1,
      retryDelay: 1,
    });
    await client.get("/x");

    expect(getToken).toHaveBeenCalledTimes(2);
    const firstHeaders = (fetchMock.mock.calls[0]?.[1] as RequestInit).headers as Headers;
    const secondHeaders = (fetchMock.mock.calls[1]?.[1] as RequestInit).headers as Headers;
    expect(firstHeaders.get("Authorization")).toBe("Bearer t1");
    expect(secondHeaders.get("Authorization")).toBe("Bearer t2");
  });

  it("injects tracking IDs via headerMap and skips nullish values", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({}));
    const client = createServerClient({
      baseUrl: "https://api.test",
      headerMap: { sessionId: "X-Session-Id", profileId: "X-Profile-Id" },
    });
    await client.get("/x", { ids: { sessionId: "s1", profileId: null } });
    const headers = (fetchMock.mock.calls[0]?.[1] as RequestInit).headers as Headers;
    expect(headers.get("X-Session-Id")).toBe("s1");
    expect(headers.has("X-Profile-Id")).toBe(false);
  });
});

describe("createServerClient — retry policy", () => {
  it("retries idempotent GET on 503", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("boom", { status: 503 }))
      .mockResolvedValueOnce(makeJsonResponse({ ok: true }));

    const client = createServerClient({
      baseUrl: "https://api.test",
      retries: 1,
      retryDelay: 1,
    });
    const result = await client.get<{ ok: boolean }>("/x");
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry POST on 503 by default (non-idempotent)", async () => {
    fetchMock.mockResolvedValueOnce(new Response("boom", { status: 503 }));

    const client = createServerClient({
      baseUrl: "https://api.test",
      retries: 3,
      retryDelay: 1,
    });
    await expect(client.post("/x", { a: 1 })).rejects.toBeInstanceOf(ServerHttpError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries POST when idempotent: true is set", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("boom", { status: 503 }))
      .mockResolvedValueOnce(makeJsonResponse({ ok: true }));

    const client = createServerClient({
      baseUrl: "https://api.test",
      retries: 1,
      retryDelay: 1,
    });
    const result = await client.post("/x", { a: 1 }, { idempotent: true });
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries 429 and honours Retry-After header (parsed in ms)", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("rate", { status: 429, headers: { "Retry-After": "0" } }))
      .mockResolvedValueOnce(makeJsonResponse({ ok: true }));

    const client = createServerClient({
      baseUrl: "https://api.test",
      retries: 1,
      retryDelay: 1,
    });
    const result = await client.get("/x");
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry 4xx (other than 408/425/429)", async () => {
    fetchMock.mockResolvedValueOnce(new Response("bad", { status: 400 }));

    const client = createServerClient({
      baseUrl: "https://api.test",
      retries: 5,
      retryDelay: 1,
    });
    await expect(client.get("/x")).rejects.toBeInstanceOf(ServerHttpError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up after `retries` attempts and throws the final error", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 502 }));

    const client = createServerClient({
      baseUrl: "https://api.test",
      retries: 2,
      retryDelay: 1,
    });
    await expect(client.get("/x")).rejects.toMatchObject({
      status: 502,
      name: "ServerHttpError",
    });
    // initial attempt + 2 retries
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("createServerClient — errors", () => {
  it("wraps a thrown network error as NETWORK_ERROR (status 0)", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const client = createServerClient({ baseUrl: "https://api.test", retries: 0 });
    const err = (await client.get("/x").catch((e: unknown) => e)) as ServerHttpError;
    expect(err).toBeInstanceOf(ServerHttpError);
    expect(err.status).toBe(0);
    expect(err.code).toBe("NETWORK_ERROR");
  });

  it("wraps an AbortError as TIMEOUT", async () => {
    const abort = new Error("aborted");
    abort.name = "AbortError";
    fetchMock.mockRejectedValueOnce(abort);

    const client = createServerClient({ baseUrl: "https://api.test", retries: 0 });
    const err = (await client.get("/x").catch((e: unknown) => e)) as ServerHttpError;
    expect(err.code).toBe("TIMEOUT");
  });

  it("extracts machine-readable `code` from a JSON error body", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ code: "ACCOUNT_LOCKED", message: "x" }), {
        status: 423,
        headers: { "Content-Type": "application/json" },
      })
    );

    const client = createServerClient({ baseUrl: "https://api.test" });
    const err = (await client.get("/x").catch((e: unknown) => e)) as ServerHttpError;
    expect(err.code).toBe("ACCOUNT_LOCKED");
    expect(err.body).toEqual({ code: "ACCOUNT_LOCKED", message: "x" });
  });

  it("serialises to a stable JSON shape", async () => {
    fetchMock.mockResolvedValue(new Response("oops", { status: 500 }));

    const client = createServerClient({
      baseUrl: "https://api.test",
      serviceName: "VDP",
      retries: 0,
    });
    const err = (await client.get("/x").catch((e: unknown) => e)) as ServerHttpError;
    const json = err.toJSON();
    expect(json).toMatchObject({
      name: "ServerHttpError",
      status: 500,
      code: "HTTP_500",
      service: "VDP",
    });
  });
});

describe("createServerClient — schema, params, body", () => {
  it("validates the response via schema and throws SCHEMA_VALIDATION on failure", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({ id: "not-a-number" }));

    const client = createServerClient({ baseUrl: "https://api.test" });
    const err = (await client
      .get("/x", {
        schema: {
          parse: (value) => {
            const v = value as { id: unknown };
            if (typeof v.id !== "number") {
              throw new Error("id must be number");
            }
            return v as { id: number };
          },
        },
      })
      .catch((e: unknown) => e)) as ServerHttpError;
    expect(err.code).toBe("SCHEMA_VALIDATION");
  });

  it("returns schema-parsed value on success", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({ id: 7 }));
    const client = createServerClient({ baseUrl: "https://api.test" });
    const result = await client.get("/x", {
      schema: { parse: (v) => v as { id: number } },
    });
    expect(result).toEqual({ id: 7 });
  });

  it("appends query params correctly", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({}));
    const client = createServerClient({ baseUrl: "https://api.test" });
    await client.get("/q", { params: { page: 2, tag: ["a", "b"] } });
    const url = fetchMock.mock.calls[0]?.[0] as string;
    const parsed = new URL(url);
    expect(parsed.searchParams.get("page")).toBe("2");
    expect(parsed.searchParams.getAll("tag")).toEqual(["a", "b"]);
  });

  it("strips Content-Type on GET requests", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({}));
    const client = createServerClient({
      baseUrl: "https://api.test",
      defaultHeaders: { "Content-Type": "application/json" },
    });
    await client.get("/x");
    const headers = (fetchMock.mock.calls[0]?.[1] as RequestInit).headers as Headers;
    expect(headers.has("Content-Type")).toBe(false);
  });

  it("serialises object bodies as JSON with Content-Type", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({}));
    const client = createServerClient({ baseUrl: "https://api.test" });
    await client.post("/x", { a: 1 });
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.body).toBe('{"a":1}');
    expect((init.headers as Headers).get("Content-Type")).toBe("application/json");
  });
});

describe("createServerClient — interceptors", () => {
  it("calls onRequest before each attempt and onResponse on success", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("boom", { status: 503 }))
      .mockResolvedValueOnce(makeJsonResponse({ ok: true }));

    const onRequest = vi.fn();
    const onResponse = vi.fn();
    const onError = vi.fn();
    const client = createServerClient({
      baseUrl: "https://api.test",
      retries: 1,
      retryDelay: 1,
      interceptors: { onRequest, onResponse, onError },
    });
    await client.get("/x");

    expect(onRequest).toHaveBeenCalledTimes(2);
    expect(onResponse).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("lets onRequest mutate headers per attempt", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({}));
    const client = createServerClient({
      baseUrl: "https://api.test",
      interceptors: {
        onRequest: (ctx) => {
          ctx.headers.set("X-Custom-Header", "custom-value");
        },
      },
    });
    await client.get("/x");
    const headers = (fetchMock.mock.calls[0]?.[1] as RequestInit).headers as Headers;
    expect(headers.get("X-Custom-Header")).toBe("custom-value");
  });

  it("preserves X-Trace-Id when provided by caller/interceptor", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({}));
    const client = createServerClient({
      baseUrl: "https://api.test",
      interceptors: {
        onRequest: (ctx) => {
          ctx.headers.set("X-Trace-Id", "provided-trace-id");
        },
      },
    });
    await client.get("/x");
    const headers = (fetchMock.mock.calls[0]?.[1] as RequestInit).headers as Headers;
    const traceId = headers.get("X-Trace-Id");
    expect(traceId).toBe("provided-trace-id");
  });

  it("generates a UUID X-Trace-Id when none is provided", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({}));
    const client = createServerClient({
      baseUrl: "https://api.test",
    });

    await client.get("/x");
    const headers = (fetchMock.mock.calls[0]?.[1] as RequestInit).headers as Headers;
    const traceId = headers.get("X-Trace-Id");
    expect(traceId).toMatch(UUID_REGEX);
  });

  it("generates a UUID X-Trace-Id when provided value is blank", async () => {
    fetchMock.mockResolvedValueOnce(makeJsonResponse({}));
    const client = createServerClient({
      baseUrl: "https://api.test",
      interceptors: {
        onRequest: (ctx) => {
          ctx.headers.set("X-Trace-Id", "   ");
        },
      },
    });

    await client.get("/x");
    const headers = (fetchMock.mock.calls[0]?.[1] as RequestInit).headers as Headers;
    const traceId = headers.get("X-Trace-Id");
    expect(traceId).toMatch(UUID_REGEX);
  });
});
