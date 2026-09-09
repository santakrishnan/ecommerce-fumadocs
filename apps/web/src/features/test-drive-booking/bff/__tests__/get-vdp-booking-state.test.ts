import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TestDriveAppointment } from "../../schemas";
import { getVdpBookingState } from "../get-vdp-booking-state";

vi.mock("server-only", () => ({}));

const cookieValues: Record<string, string | undefined> = {};

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) => {
        const value = cookieValues[name];
        return value === undefined ? undefined : { value };
      },
    }),
}));

const VIN = "3TMDZ5BN8NM126690";

function appointment(overrides: Partial<TestDriveAppointment>): TestDriveAppointment {
  return {
    id: "td-1",
    dealerCode: "longo",
    dealerName: "Longo Toyota",
    dealerAddress: "3534 N Peck Rd, El Monte, CA 91731",
    date: "2026-03-24",
    dayLabel: "Tomorrow",
    timeSlot: "12:00 PM",
    vehicles: [
      {
        vin: "OTHERVIN000000001",
        year: 2022,
        make: "Toyota",
        model: "RAV4",
        trim: "Hybrid XSE",
        title: "TOYOTA RAV4 HYBRID XSE",
      },
    ],
    ...overrides,
  };
}

function setBookings(list: TestDriveAppointment[]) {
  cookieValues["demo-vdp-booking"] = JSON.stringify(list);
}

beforeEach(() => {
  for (const key of Object.keys(cookieValues)) {
    delete cookieValues[key];
  }
});

describe("getVdpBookingState — default mode (real bookings)", () => {
  it("no bookings → no_appointment, no appointment", async () => {
    const result = await getVdpBookingState(VIN, "longo");
    expect(result.state).toBe("no_appointment");
    expect(result.appointment).toBeUndefined();
  });

  it("a booking for this VIN → this_vin with that appointment", async () => {
    setBookings([
      appointment({
        vehicles: [
          {
            vin: VIN,
            year: 2023,
            make: "Toyota",
            model: "Highlander",
            trim: "Hybrid Limited",
            title: "TOYOTA HIGHLANDER HYBRID LIMITED",
          },
        ],
      }),
    ]);
    const result = await getVdpBookingState(VIN, "longo");
    expect(result.state).toBe("this_vin");
    expect(result.appointment?.dealerCode).toBe("longo");
  });

  it("a booking at this dealer for another car → same_dealer_other_vin", async () => {
    setBookings([appointment({ dealerCode: "longo" })]);
    const result = await getVdpBookingState(VIN, "longo");
    expect(result.state).toBe("same_dealer_other_vin");
  });

  it("a booking at another dealer → different_dealer", async () => {
    setBookings([appointment({ dealerCode: "manhattan" })]);
    const result = await getVdpBookingState(VIN, "longo");
    expect(result.state).toBe("different_dealer");
  });

  it("finds this VIN among multiple stored bookings", async () => {
    setBookings([
      appointment({ id: "td-a", dealerCode: "manhattan" }),
      appointment({
        id: "td-b",
        dealerCode: "bay-ridge",
        vehicles: [
          {
            vin: VIN,
            year: 2023,
            make: "Toyota",
            model: "Highlander",
            title: "TOYOTA HIGHLANDER",
          },
        ],
      }),
    ]);
    const result = await getVdpBookingState(VIN, "longo");
    expect(result.state).toBe("this_vin");
    expect(result.appointment?.id).toBe("td-b");
  });
});

describe("getVdpBookingState — demo override (on demand)", () => {
  it("forces the selected state and ignores real bookings", async () => {
    setBookings([
      appointment({
        vehicles: [
          {
            vin: VIN,
            year: 2023,
            make: "Toyota",
            model: "Highlander",
            title: "TOYOTA HIGHLANDER",
          },
        ],
      }),
    ]);
    cookieValues["demo-vdp-booking-state"] = "no_appointment";
    const result = await getVdpBookingState(VIN, "longo");
    expect(result.state).toBe("no_appointment");
    expect(result.appointment).toBeUndefined();
  });

  it("'default' selector uses real bookings", async () => {
    setBookings([appointment({ dealerCode: "longo" })]);
    cookieValues["demo-vdp-booking-state"] = "default";
    const result = await getVdpBookingState(VIN, "longo");
    expect(result.state).toBe("same_dealer_other_vin");
  });
});
