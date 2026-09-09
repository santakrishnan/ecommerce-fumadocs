"use client";

import type { VdpBookingState } from "@config/vdp-booking-state";
import {
  BookingSummary,
  BookTestDriveModal,
  type TestDriveAppointment,
  type TestDriveVehicle,
  useTestDriveBooking,
} from "@features/test-drive-booking";
import { BookingStrip } from "./booking-strip";

interface BookingSectionProps {
  currentVehicle: TestDriveVehicle;
  dayLabel: string;
  dealerAddress: string;
  dealerCode: string;
  dealerName: string;
  initialAppointment: TestDriveAppointment | null;
  isAnonymous: boolean;
  slots: string[];
  state: VdpBookingState;
  viewedDate: string;
}

type CardMode = "confirmed" | "add-car" | "slots";

function deriveCardMode(
  state: VdpBookingState,
  appointment: TestDriveAppointment | null,
  includesThisVin: boolean,
  dealerCode: string
): CardMode {
  if (appointment && includesThisVin && appointment.dealerCode === dealerCode) {
    return "confirmed";
  }
  if (state === "same_dealer_other_vin" && appointment && !includesThisVin) {
    return "add-car";
  }
  return "slots";
}

function BookingSection({
  currentVehicle,
  dayLabel,
  dealerAddress,
  dealerCode,
  dealerName,
  initialAppointment,
  isAnonymous,
  slots,
  state,
  viewedDate,
}: BookingSectionProps) {
  const booking = useTestDriveBooking({
    currentVehicle,
    dealerAddress,
    dealerCode,
    dealerName,
    initialAppointment,
    requiresSignup: isAnonymous,
    viewedDate,
  });

  const cardMode = deriveCardMode(state, booking.appointment, booking.includesThisVin, dealerCode);

  return (
    <>
      {cardMode === "confirmed" && booking.appointment && (
        <BookingSummary
          appointment={booking.appointment}
          mode="confirmed"
          onAddThisCar={booking.onAddThisCar}
          onManage={booking.onOpenManage}
        />
      )}

      {cardMode === "add-car" && booking.appointment && (
        <BookingSummary
          appointment={booking.appointment}
          mode="add-car"
          onAddThisCar={booking.onAddThisCar}
          onManage={booking.onOpenManage}
        />
      )}

      {cardMode === "slots" && (
        <BookingStrip dayLabel={dayLabel} onSlotSelect={booking.onSelectSlot} slots={slots} />
      )}

      <BookTestDriveModal booking={booking} />
    </>
  );
}

export { BookingSection, deriveCardMode };
