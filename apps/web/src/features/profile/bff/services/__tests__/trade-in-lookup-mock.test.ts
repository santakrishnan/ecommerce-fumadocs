import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("mockLookupTradeInVehicle", () => {
  it("trims whitespace from the plate and state before persisting them", async () => {
    const { mockLookupTradeInVehicle } = await import("../trade-in-lookup-mock");

    const result = await mockLookupTradeInVehicle("  8xyz123  ", "  ny ");

    expect(result?.licensePlate).toBe("8XYZ123");
    expect(result?.state).toBe("NY");
  });

  it("returns the fixture vehicle whose license plate matches the input, case-insensitively", async () => {
    const { mockLookupTradeInVehicle } = await import("../trade-in-lookup-mock");

    const result = await mockLookupTradeInVehicle("8xyz123", "ny");

    expect(result?.title).toBe("TOYOTA PREVIA");
    expect(result?.licensePlate).toBe("8XYZ123");
    expect(result?.state).toBe("NY");
  });

  it("falls back to the first fixture vehicle when the plate matches nothing", async () => {
    const { mockLookupTradeInVehicle } = await import("../trade-in-lookup-mock");

    const result = await mockLookupTradeInVehicle("UNKNOWN1", "CA");

    expect(result?.title).toBe("MAZDA CX-5 2.5 S AWD");
    expect(result?.licensePlate).toBe("UNKNOWN1");
    expect(result?.state).toBe("CA");
  });
});
