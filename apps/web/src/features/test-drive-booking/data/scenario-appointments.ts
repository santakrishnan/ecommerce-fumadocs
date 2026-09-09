import type { VdpBookingState } from "@config/vdp-booking-state";
import { addDaysDateOnly, dayLabelFor, todayDateOnly } from "../lib/format-appointment";
import type { TestDriveAppointment, TestDriveVehicle } from "../schemas";

const OTHER_DEALER = {
  dealerCode: "toyota-manhattan",
  dealerName: "Toyota of Manhattan",
  dealerAddress: "666 11th Ave, New York, NY 10019",
};

const OTHER_VEHICLE: TestDriveVehicle = {
  vin: "2T3P1RFV8NW300112",
  year: 2022,
  make: "Toyota",
  model: "RAV4",
  trim: "Hybrid XSE",
  title: "TOYOTA RAV4 HYBRID XSE",
  imageUrl: "/images/profile/toyota-grand-highlander-xle.png",
};

interface BuildExistingAppointmentArgs {
  currentVehicle: TestDriveVehicle;
  dealerAddress: string;
  dealerCode: string;
  dealerName: string;
  slots: string[];
  state: VdpBookingState;
}

function buildExistingAppointment({
  dealerAddress,
  dealerCode,
  dealerName,
  currentVehicle,
  slots,
  state,
}: BuildExistingAppointmentArgs): TestDriveAppointment | null {
  const firstSlot = slots[0] ?? "12:00 PM";
  const tomorrow = addDaysDateOnly(1);
  const today = todayDateOnly();
  const thisDealer = { dealerCode, dealerName, dealerAddress };

  switch (state) {
    case "this_vin":
      return {
        id: "td-existing-this-vin",
        ...thisDealer,
        date: tomorrow,
        dayLabel: dayLabelFor(tomorrow),
        timeSlot: firstSlot,
        vehicles: [currentVehicle],
      };
    case "same_dealer_other_vin":
      return {
        id: "td-existing-same-dealer",
        ...thisDealer,
        date: today,
        dayLabel: dayLabelFor(today),
        timeSlot: firstSlot,
        vehicles: [OTHER_VEHICLE],
      };
    case "different_dealer":
      return {
        id: "td-existing-different-dealer",
        ...OTHER_DEALER,
        date: today,
        dayLabel: dayLabelFor(today),
        timeSlot: firstSlot,
        vehicles: [OTHER_VEHICLE],
      };
    default:
      return null;
  }
}

export { buildExistingAppointment };
