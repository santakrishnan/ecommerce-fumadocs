// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildAgentPayload } from "../agent-payload";

describe("buildAgentPayload", () => {
  describe("agentVersion", () => {
    it("sources agentVersion from the request", () => {
      const body = buildAgentPayload({ query: "trucks", agentVersion: "v1" });

      expect(body.agentVersion).toBe("v1");
    });

    it("defaults agentVersion to v2 when absent from the request", () => {
      const body = buildAgentPayload({ query: "trucks" });

      expect(body.agentVersion).toBe("v2");
    });

    it("forwards v2 verbatim when explicitly requested", () => {
      const body = buildAgentPayload({ query: "trucks", agentVersion: "v2" });

      expect(body.agentVersion).toBe("v2");
    });
  });

  describe("location.radiusMiles", () => {
    it("injects radiusMiles: 100 for v1", () => {
      const body = buildAgentPayload({
        query: "trucks",
        agentVersion: "v1",
        location: { zipCode: "91711", latitude: 34.0966, longitude: -117.7198 },
      });

      expect(body.location).toStrictEqual({
        zipCode: "91711",
        latitude: 34.0966,
        longitude: -117.7198,
        radiusMiles: 100,
      });
    });

    it("injects radiusMiles: 100 for v2", () => {
      const body = buildAgentPayload({
        query: "trucks",
        agentVersion: "v2",
        location: { zipCode: "91711", latitude: 34.0966, longitude: -117.7198 },
      });

      expect(body.location).toStrictEqual({
        zipCode: "91711",
        latitude: 34.0966,
        longitude: -117.7198,
        radiusMiles: 100,
      });
    });

    it("omits location when none is provided", () => {
      const body = buildAgentPayload({ query: "trucks", agentVersion: "v2" });

      expect(body).not.toHaveProperty("location");
    });
  });

  describe("passthrough of extra fields", () => {
    it("passes through filters, responseMode, and explorationAxes as provided", () => {
      const body = buildAgentPayload({
        agentVersion: "v2",
        searchId: "20eea310-1665-4689-b2bf-708ecee7bfec",
        filters: [
          { key: "vehicleCategory", value: "Truck" },
          { key: "model", value: "tacoma" },
        ],
        responseMode: "InventoryCards",
        explorationAxes: ["trim"],
      } as Parameters<typeof buildAgentPayload>[0]);

      expect(body.searchId).toBe("20eea310-1665-4689-b2bf-708ecee7bfec");
      expect(body.filters).toStrictEqual([
        { key: "vehicleCategory", value: "Truck" },
        { key: "model", value: "tacoma" },
      ]);
      expect(body.responseMode).toBe("InventoryCards");
      expect(body.explorationAxes).toStrictEqual(["trim"]);
    });

    it("does not forward a debug envelope", () => {
      const body = buildAgentPayload({
        query: "trucks",
        agentVersion: "v2",
        debug: { runtimeSessionId: "abc" },
      } as Parameters<typeof buildAgentPayload>[0]);

      expect(body).not.toHaveProperty("debug");
    });
  });

  describe("v1-only query-prefix composition (guarded by agentVersion === 'v1')", () => {
    it("prepends filter values with a dash when a user query is present", () => {
      const body = buildAgentPayload({
        query: "red ones",
        agentVersion: "v1",
        filters: [
          { key: "make", values: ["Toyota"] },
          { key: "model", values: ["Tacoma"] },
        ],
      });

      expect(body.query).toBe("Toyota Tacoma - red ones");
    });

    it("uses only the filter values (no dash) when there is no user query", () => {
      const body = buildAgentPayload({
        agentVersion: "v1",
        filters: [
          { key: "make", values: ["Toyota"] },
          { key: "model", values: ["Tacoma"] },
        ],
      });

      expect(body.query).toBe("Toyota Tacoma");
    });

    it("includes every value of multi-value filters, in order", () => {
      const body = buildAgentPayload({
        agentVersion: "v1",
        filters: [
          { key: "model", values: ["Tacoma", "Tundra"] },
          { key: "bodyStyle", value: "Truck" },
        ],
      });

      expect(body.query).toBe("Tacoma Tundra Truck");
    });

    it("leaves the query untouched when there are no filters", () => {
      const body = buildAgentPayload({ query: "family suv", agentVersion: "v1" });

      expect(body.query).toBe("family suv");
    });

    it("does not derive the prefix from smartFilters", () => {
      const body = buildAgentPayload({
        query: "trucks",
        agentVersion: "v1",
        smartFilters: [{ key: "make", values: ["Toyota"] }],
      } as Parameters<typeof buildAgentPayload>[0]);

      expect(body.query).toBe("trucks");
    });

    it("still forwards the structured filters array", () => {
      const filters = [{ key: "make", values: ["Toyota"] }];
      const body = buildAgentPayload({ query: "trucks", agentVersion: "v1", filters });

      expect(body.filters).toStrictEqual(filters);
    });

    it("omits query when neither filters nor a user query are provided", () => {
      const body = buildAgentPayload({
        agentVersion: "v1",
        location: { zipCode: "91711", latitude: 34.0966, longitude: -117.7198 },
      });

      expect(body).not.toHaveProperty("query");
    });
  });

  describe("v2 leaves the query unchanged (no prefix composition)", () => {
    it("does not prepend filter values to the query for v2", () => {
      const body = buildAgentPayload({
        query: "red ones",
        agentVersion: "v2",
        filters: [
          { key: "make", values: ["Toyota"] },
          { key: "model", values: ["Tacoma"] },
        ],
      });

      expect(body.query).toBe("red ones");
    });

    it("does not prepend filter values when agentVersion is absent (defaults to v2)", () => {
      const body = buildAgentPayload({
        query: "red ones",
        filters: [{ key: "make", values: ["Toyota"] }],
      });

      expect(body.query).toBe("red ones");
    });

    it("still forwards the structured filters array untouched", () => {
      const filters = [{ key: "make", values: ["Toyota"] }];
      const body = buildAgentPayload({ query: "trucks", agentVersion: "v2", filters });

      expect(body.filters).toStrictEqual(filters);
    });
  });
});
