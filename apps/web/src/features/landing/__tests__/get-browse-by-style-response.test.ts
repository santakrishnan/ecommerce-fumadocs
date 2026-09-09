// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const safeParseMock = vi.fn();

vi.mock("@features/landing/contracts/browse-by-style.schema", async () => {
  const actual = await vi.importActual<
    typeof import("@features/landing/contracts/browse-by-style.schema")
  >("@features/landing/contracts/browse-by-style.schema");

  return {
    ...actual,
    browseByStyleRouteResponseSchema: {
      safeParse: safeParseMock,
    },
  };
});

describe("getBrowseByStyleResponse", () => {
  let getBrowseByStyleResponse: typeof import("../bff/services/get-browse-by-style-response").getBrowseByStyleResponse;

  beforeAll(async () => {
    ({ getBrowseByStyleResponse } = await import("../bff/services/get-browse-by-style-response"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed success payload when schema validation succeeds", () => {
    const expected = {
      title: "Browse By Style",
      subtitle: "Find the vehicle that fits your lifestyle",
      items: [{ id: "style-suv", cardType: "style-category" }],
      meta: { source: "static" },
    };
    safeParseMock.mockReturnValue({ success: true, data: expected });

    const result = getBrowseByStyleResponse();

    expect(result).toEqual(expected);
  });

  it("returns empty items when fixture is 'empty'", () => {
    const expected = {
      title: "Browse By Style",
      subtitle: "Find the vehicle that fits your lifestyle",
      items: [],
      meta: { source: "static" },
    };
    safeParseMock.mockReturnValue({ success: true, data: expected });

    const result = getBrowseByStyleResponse("empty");

    expect(result).toEqual(expected);
  });

  it("logs and returns validation error fallback when schema validation fails", () => {
    safeParseMock.mockReturnValue({
      success: false,
      error: {
        issues: [{ message: "invalid payload" }],
      },
    });

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = getBrowseByStyleResponse("success");

    expect(errorSpy).toHaveBeenCalledWith(
      "[getBrowseByStyleResponse] Invalid Browse By Style payload",
      [{ message: "invalid payload" }]
    );
    expect(result).toEqual({
      error: {
        code: "BROWSE_BY_STYLE_VALIDATION_FAILED",
        message: "Browse by style payload did not match contract.",
        details: {
          source: "getBrowseByStyleResponse",
        },
      },
    });

    errorSpy.mockRestore();
  });

  it("includes action metadata with search-transition seed on each card", () => {
    const itemWithAction = {
      id: "style-suv",
      cardType: "style-category",
      categoryKey: "suv",
      title: "SUVs",
      action: {
        id: "action-suv",
        type: "navigate-to-search",
        target: "/search",
        seed: { categoryKey: "suv", label: "SUVs" },
      },
    };
    const expected = {
      title: "Browse By Style",
      items: [itemWithAction],
      meta: { source: "static" },
    };
    safeParseMock.mockReturnValue({ success: true, data: expected });

    const result = getBrowseByStyleResponse();

    expect(result).toEqual(expected);
    if (!("error" in result)) {
      expect(result.items[0]?.action.type).toBe("navigate-to-search");
      expect(result.items[0]?.action.target).toBe("/search");
      expect(result.items[0]?.action.seed?.categoryKey).toBe("suv");
    }
  });

  it("defaults to 'success' fixture when no parameter is provided", () => {
    const expected = {
      title: "Browse By Style",
      items: [{ id: "style-suv" }],
      meta: { source: "static" },
    };
    safeParseMock.mockReturnValue({ success: true, data: expected });

    const result = getBrowseByStyleResponse(null);

    expect(result).toEqual(expected);
  });
});

describe("browse by style contract", () => {
  it("success fixture matches the real schema", async () => {
    const { browseByStyleRouteResponseSchema } = await vi.importActual<
      typeof import("@features/landing/contracts/browse-by-style.schema")
    >("@features/landing/contracts/browse-by-style.schema");
    const { BROWSE_BY_STYLE_SUCCESS_RESPONSE } = await import(
      "../__fixtures__/browse-by-style.fixtures"
    );

    const parsed = browseByStyleRouteResponseSchema.safeParse(BROWSE_BY_STYLE_SUCCESS_RESPONSE);

    if (!parsed.success) {
      expect.fail(`Fixture does not match schema: ${JSON.stringify(parsed.error.issues, null, 2)}`);
    }
  });

  it("empty fixture matches the real schema", async () => {
    const { browseByStyleRouteResponseSchema } = await vi.importActual<
      typeof import("@features/landing/contracts/browse-by-style.schema")
    >("@features/landing/contracts/browse-by-style.schema");
    const { BROWSE_BY_STYLE_EMPTY_RESPONSE } = await import(
      "../__fixtures__/browse-by-style.fixtures"
    );

    const parsed = browseByStyleRouteResponseSchema.safeParse(BROWSE_BY_STYLE_EMPTY_RESPONSE);

    expect(parsed.success).toBe(true);
  });

  it("validation error fixture matches the real schema", async () => {
    const { browseByStyleRouteResponseSchema } = await vi.importActual<
      typeof import("@features/landing/contracts/browse-by-style.schema")
    >("@features/landing/contracts/browse-by-style.schema");
    const { BROWSE_BY_STYLE_VALIDATION_ERROR_RESPONSE } = await import(
      "../__fixtures__/browse-by-style.fixtures"
    );

    const parsed = browseByStyleRouteResponseSchema.safeParse(
      BROWSE_BY_STYLE_VALIDATION_ERROR_RESPONSE
    );

    expect(parsed.success).toBe(true);
  });
});
