// @vitest-environment node
import type { ResolvedBedService } from "@config/bed-services";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BED_API_KEY_HEADER,
  BED_SESSION_HEADER,
  BED_TENANT_HEADER,
  BED_VISITOR_HEADER,
  type BedVisitorIdentity,
  buildBedHeaders,
  buildBedHeadersWithApiKey,
  createBedClient,
} from "../bed-client";

const { createServerClient } = vi.hoisted(() => ({
  createServerClient: vi.fn(),
}));

vi.mock("../server-api", () => ({
  createServerClient,
}));

describe("buildBedHeaders", () => {
  const mockService: ResolvedBedService = {
    serviceName: "Test Service",
    baseUrl: "https://api.example.com/test/v1",
    apiKey: "test-api-key",
    tenantId: "test-tenant",
  };

  it("includes X-Tenant-Id when service.tenantId is present", () => {
    const headers = buildBedHeaders(mockService);

    expect(headers[BED_TENANT_HEADER]).toBe("test-tenant");
  });

  it("omits X-Tenant-Id when service.tenantId is undefined", () => {
    const serviceWithoutTenant = { ...mockService, tenantId: undefined };
    const headers = buildBedHeaders(serviceWithoutTenant);

    expect(headers).not.toHaveProperty(BED_TENANT_HEADER);
  });

  it("includes X-Visitor-Id ONLY when identity.visitorId is truthy", () => {
    const identity: BedVisitorIdentity = {
      visitorId: "visitor-123",
      sessionId: "session-456",
    };
    const headers = buildBedHeaders(mockService, identity);

    expect(headers[BED_VISITOR_HEADER]).toBe("visitor-123");
  });

  it("omits X-Visitor-Id when identity.visitorId is null", () => {
    const identity: BedVisitorIdentity = {
      visitorId: null,
      sessionId: "session-456",
    };
    const headers = buildBedHeaders(mockService, identity);

    expect(headers).not.toHaveProperty(BED_VISITOR_HEADER);
  });

  it("omits X-Visitor-Id when identity.visitorId is undefined", () => {
    const identity: BedVisitorIdentity = {
      visitorId: undefined,
      sessionId: "session-456",
    };
    const headers = buildBedHeaders(mockService, identity);

    expect(headers).not.toHaveProperty(BED_VISITOR_HEADER);
  });

  it("includes X-Session-Id ONLY when identity.sessionId is truthy", () => {
    const identity: BedVisitorIdentity = {
      visitorId: "visitor-123",
      sessionId: "session-456",
    };
    const headers = buildBedHeaders(mockService, identity);

    expect(headers[BED_SESSION_HEADER]).toBe("session-456");
  });

  it("omits X-Session-Id when identity.sessionId is null", () => {
    const identity: BedVisitorIdentity = {
      visitorId: "visitor-123",
      sessionId: null,
    };
    const headers = buildBedHeaders(mockService, identity);

    expect(headers).not.toHaveProperty(BED_SESSION_HEADER);
  });

  it("omits X-Session-Id when identity.sessionId is undefined", () => {
    const identity: BedVisitorIdentity = {
      visitorId: "visitor-123",
      sessionId: undefined,
    };
    const headers = buildBedHeaders(mockService, identity);

    expect(headers).not.toHaveProperty(BED_SESSION_HEADER);
  });

  it("omits visitor headers when identity is undefined", () => {
    const headers = buildBedHeaders(mockService);

    expect(headers).not.toHaveProperty(BED_VISITOR_HEADER);
    expect(headers).not.toHaveProperty(BED_SESSION_HEADER);
  });

  it("omits visitor headers when identity has null/undefined values", () => {
    const identity: BedVisitorIdentity = {
      visitorId: null,
      sessionId: null,
    };
    const headers = buildBedHeaders(mockService, identity);

    expect(headers).not.toHaveProperty(BED_VISITOR_HEADER);
    expect(headers).not.toHaveProperty(BED_SESSION_HEADER);
  });

  it("does not include X-API-Key in the returned headers", () => {
    const headers = buildBedHeaders(mockService);

    expect(headers).not.toHaveProperty(BED_API_KEY_HEADER);
  });

  it("returns empty object when no headers should be included", () => {
    const serviceWithoutTenant = { ...mockService, tenantId: undefined };
    const headers = buildBedHeaders(serviceWithoutTenant);

    expect(headers).toEqual({});
  });
});

describe("buildBedHeadersWithApiKey", () => {
  const mockService: ResolvedBedService = {
    serviceName: "Test Service",
    baseUrl: "https://api.example.com/test/v1",
    apiKey: "test-api-key",
    tenantId: "test-tenant",
  };

  it("includes X-API-Key in the returned headers", () => {
    const headers = buildBedHeadersWithApiKey(mockService);

    expect(headers[BED_API_KEY_HEADER]).toBe("test-api-key");
  });

  it("includes all headers from buildBedHeaders plus X-API-Key", () => {
    const identity: BedVisitorIdentity = {
      visitorId: "visitor-123",
      sessionId: "session-456",
    };
    const headers = buildBedHeadersWithApiKey(mockService, identity);

    expect(headers[BED_TENANT_HEADER]).toBe("test-tenant");
    expect(headers[BED_VISITOR_HEADER]).toBe("visitor-123");
    expect(headers[BED_SESSION_HEADER]).toBe("session-456");
    expect(headers[BED_API_KEY_HEADER]).toBe("test-api-key");
  });

  it("only includes X-API-Key when no other headers are applicable", () => {
    const serviceWithoutTenant = { ...mockService, tenantId: undefined };
    const headers = buildBedHeadersWithApiKey(serviceWithoutTenant);

    expect(headers).toEqual({
      [BED_API_KEY_HEADER]: "test-api-key",
    });
  });
});

describe("createBedClient", () => {
  const mockService: ResolvedBedService = {
    serviceName: "Test Service",
    baseUrl: "https://api.example.com/test/v1",
    apiKey: "test-api-key",
    tenantId: "test-tenant",
  };

  beforeEach(() => {
    vi.mocked(createServerClient).mockReturnValue({} as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls createServerClient with the shared header-building logic", () => {
    const identity: BedVisitorIdentity = {
      visitorId: "visitor-123",
      sessionId: "session-456",
    };

    createBedClient(mockService, identity);

    expect(createServerClient).toHaveBeenCalledWith({
      baseUrl: "https://api.example.com/test/v1",
      serviceName: "Test Service",
      apiKey: { headerName: BED_API_KEY_HEADER, value: "test-api-key" },
      defaultHeaders: {
        [BED_TENANT_HEADER]: "test-tenant",
        [BED_VISITOR_HEADER]: "visitor-123",
        [BED_SESSION_HEADER]: "session-456",
      },
    });
  });

  it("passes undefined defaultHeaders when buildBedHeaders returns empty object", () => {
    const serviceWithoutTenant = { ...mockService, tenantId: undefined };

    createBedClient(serviceWithoutTenant);

    expect(createServerClient).toHaveBeenCalledWith({
      baseUrl: "https://api.example.com/test/v1",
      serviceName: "Test Service",
      apiKey: { headerName: BED_API_KEY_HEADER, value: "test-api-key" },
      defaultHeaders: undefined,
    });
  });

  it("omits visitor headers for anonymous visitors", () => {
    const anonymousIdentity: BedVisitorIdentity = {
      visitorId: null,
      sessionId: null,
    };

    createBedClient(mockService, anonymousIdentity);

    expect(createServerClient).toHaveBeenCalledWith({
      baseUrl: "https://api.example.com/test/v1",
      serviceName: "Test Service",
      apiKey: { headerName: BED_API_KEY_HEADER, value: "test-api-key" },
      defaultHeaders: {
        [BED_TENANT_HEADER]: "test-tenant",
      },
    });
  });

  it("preserves existing behavior when no identity is provided", () => {
    createBedClient(mockService);

    expect(createServerClient).toHaveBeenCalledWith({
      baseUrl: "https://api.example.com/test/v1",
      serviceName: "Test Service",
      apiKey: { headerName: BED_API_KEY_HEADER, value: "test-api-key" },
      defaultHeaders: {
        [BED_TENANT_HEADER]: "test-tenant",
      },
    });
  });
});
