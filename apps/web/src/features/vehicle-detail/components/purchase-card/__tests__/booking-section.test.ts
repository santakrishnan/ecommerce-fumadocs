import type { TestDriveAppointment } from "@features/test-drive-booking";
import { describe, expect, it } from "vitest";
import { deriveCardMode } from "../booking-section";

const APPOINTMENT: TestDriveAppointment = {
  id: "td-1",
  dealerCode: "bay-ridge",
  dealerName: "Toyota of Bay Ridge",
  dealerAddress: "6401 6th Ave, Brooklyn, NY 11220",
  date: "2026-03-24",
  dayLabel: "Tomorrow",
  timeSlot: "12:00 PM",
  vehicles: [
    {
      vin: "3TMDZ5BN8NM126690",
      year: 2023,
      make: "Toyota",
      model: "Highlander",
      title: "TOYOTA HIGHLANDER",
    },
  ],
};

describe("deriveCardMode", () => {
  it("returns 'confirmed' when the appointment includes this VIN at this dealer", () => {
    expect(deriveCardMode("default", APPOINTMENT, true, "bay-ridge")).toBe("confirmed");
  });

  it("does not confirm when the appointment is at a different dealer", () => {
    expect(deriveCardMode("default", APPOINTMENT, true, "longo")).toBe("slots");
  });

  it("returns 'add-car' for same_dealer_other_vin with an appointment not including this VIN", () => {
    expect(deriveCardMode("same_dealer_other_vin", APPOINTMENT, false, "bay-ridge")).toBe(
      "add-car"
    );
  });

  it("returns 'slots' when there is no appointment", () => {
    expect(deriveCardMode("no_appointment", null, false, "bay-ridge")).toBe("slots");
  });

  it("returns 'slots' for a different-dealer appointment", () => {
    expect(deriveCardMode("different_dealer", APPOINTMENT, false, "bay-ridge")).toBe("slots");
  });
});
