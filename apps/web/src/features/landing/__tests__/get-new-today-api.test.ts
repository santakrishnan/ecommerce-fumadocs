// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  NEW_TODAY_SUCCESS_RESPONSE,
  NEW_TODAY_VALIDATION_ERROR_RESPONSE,
} from "../__fixtures__/new-today.fixtures";
import { getNewToday } from "../api/get-new-today";
import { getNewTodayResponse } from "../services/get-new-today-response";

vi.mock("../services/get-new-today-response", () => ({
  getNewTodayResponse: vi.fn(),
}));

const mockedGetNewTodayResponse = vi.mocked(getNewTodayResponse);

describe("getNewToday (feature API helper)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the shared use case in-process and returns the success payload", async () => {
    mockedGetNewTodayResponse.mockResolvedValue(NEW_TODAY_SUCCESS_RESPONSE);

    const result = await getNewToday();

    expect(result).toEqual(NEW_TODAY_SUCCESS_RESPONSE);
    expect(mockedGetNewTodayResponse).toHaveBeenCalledWith({ zipCode: null });
  });

  it("forwards the cookie-derived zip code to the use case", async () => {
    mockedGetNewTodayResponse.mockResolvedValue(NEW_TODAY_SUCCESS_RESPONSE);

    await getNewToday("90210");

    expect(mockedGetNewTodayResponse).toHaveBeenCalledWith({ zipCode: "90210" });
  });

  it("throws when the use case reports a validation error", async () => {
    mockedGetNewTodayResponse.mockResolvedValue(NEW_TODAY_VALIDATION_ERROR_RESPONSE);

    await expect(getNewToday()).rejects.toThrow(NEW_TODAY_VALIDATION_ERROR_RESPONSE.error.message);
  });
});
