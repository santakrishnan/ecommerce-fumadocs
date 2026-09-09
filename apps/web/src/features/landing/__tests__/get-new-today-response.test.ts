// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const safeParseMock = vi.fn();

vi.mock("@features/landing/data/schemas", async () => {
  const actual = await vi.importActual<typeof import("@features/landing/data/schemas")>(
    "@features/landing/data/schemas"
  );

  return {
    ...actual,
    newTodayResponseSchema: {
      safeParse: safeParseMock,
    },
  };
});

describe("getNewTodayResponse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed success payload when schema validation succeeds", async () => {
    const expected = {
      vehicles: [{ VehicleInfo: { VehicleID: 1 } }],
    };
    safeParseMock.mockReturnValue({ success: true, data: expected });

    const { getNewTodayResponse } = await import("../services/get-new-today-response");
    const result = await getNewTodayResponse();

    expect(result).toEqual(expected);
  });

  it("logs and returns empty fallback when schema validation fails", async () => {
    safeParseMock.mockReturnValue({
      success: false,
      error: {
        issues: [{ message: "invalid payload" }],
      },
    });

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { getNewTodayResponse } = await import("../services/get-new-today-response");
    const result = await getNewTodayResponse({ fixture: "success" });

    expect(errorSpy).toHaveBeenCalledWith("[getNewTodayResponse] Invalid New Today payload", [
      { message: "invalid payload" },
    ]);
    expect(result).toEqual({
      error: {
        code: "UPSTREAM_SCHEMA_VALIDATION_FAILED",
        message: "New Today payload did not match contract.",
        details: {
          endpoint: "/api/v1/recommendations/today",
        },
      },
    });

    errorSpy.mockRestore();
  });
});
