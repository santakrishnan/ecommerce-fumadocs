// @vitest-environment node
import {
  FILTERS_SUCCESS_FIXTURE,
  FILTERS_UPSTREAM_FIXTURE,
} from "../../__fixtures__/filters.fixture";
import { mapFiltersUpstreamToResponse } from "../filters.mapper";

describe("mapFiltersUpstreamToResponse", () => {
  it("maps upstream fixture to BFF response fixture", () => {
    const result = mapFiltersUpstreamToResponse(FILTERS_UPSTREAM_FIXTURE);
    expect(result).toEqual(FILTERS_SUCCESS_FIXTURE);
  });

  it("handles missing meta gracefully", () => {
    const upstream = { data: FILTERS_UPSTREAM_FIXTURE.data };
    const result = mapFiltersUpstreamToResponse(upstream as typeof FILTERS_UPSTREAM_FIXTURE);
    expect(result.meta.traceId).toBe("");
    expect(typeof result.meta.timestamp).toBe("string");
  });
});
