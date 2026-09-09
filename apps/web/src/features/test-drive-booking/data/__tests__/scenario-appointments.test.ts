import { describe, expect, it } from "vitest";
import { todayDateOnly } from "../../lib/format-appointment";
import type { TestDriveVehicle } from "../../schemas";
import { buildExistingAppointment } from "../scenario-appointments";

const CURRENT_VEHICLE: TestDriveVehicle = {
  vin: "3TMDZ5BN8NM126690",
  year: 2023,
  make: "Toyota",
  model: "Highlander",
  trim: "Hybrid Limited",
  title: "TOYOTA HIGHLANDER HYBRID LIMITED",
};

const BASE = {
  dealerAddress: "6401 6th Ave, Brooklyn, NY 11220",
  dealerCode: "bay-ridge",
  dealerName: "Toyota of Bay Ridge",
  currentVehicle: CURRENT_VEHICLE,
  slots: ["12:00 PM", "2:30 PM"],
};

describe("buildExistingAppointment", () => {
  it("returns null when there is no existing appointment", () => {
    expect(buildExistingAppointment({ ...BASE, state: "no_appointment" })).toBeNull();
  });

  it("includes this vehicle for the this_vin state", () => {
    const appointment = buildExistingAppointment({ ...BASE, state: "this_vin" });
    expect(appointment?.dealerCode).toBe("bay-ridge");
    expect(appointment?.vehicles.some((v) => v.vin === CURRENT_VEHICLE.vin)).toBe(true);
  });

  it("uses another vehicle at this dealer today for same_dealer_other_vin", () => {
    const appointment = buildExistingAppointment({ ...BASE, state: "same_dealer_other_vin" });
    expect(appointment?.dealerCode).toBe("bay-ridge");
    expect(appointment?.date).toBe(todayDateOnly());
    expect(appointment?.vehicles.some((v) => v.vin === CURRENT_VEHICLE.vin)).toBe(false);
  });

  it("uses a different dealer on the viewed day for different_dealer", () => {
    const appointment = buildExistingAppointment({ ...BASE, state: "different_dealer" });
    expect(appointment?.dealerCode).not.toBe("bay-ridge");
    expect(appointment?.date).toBe(todayDateOnly());
    expect(appointment?.timeSlot).toBe("12:00 PM");
  });
});
