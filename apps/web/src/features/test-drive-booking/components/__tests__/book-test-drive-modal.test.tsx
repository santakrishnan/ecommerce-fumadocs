/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { UseTestDriveBookingResult } from "../../hooks/use-test-drive-booking";
import type { TestDriveAppointment, TestDriveVehicle } from "../../schemas";
import { BookTestDriveModal } from "../book-test-drive-modal";

const CONFIRMED_RE = /Your test drive is confirmed at Toyota of Bay Ridge/;
const SAME_TIME_RE = /You already have an appointment at the same time/;
const REPLACE_RE = /replace appointment/i;
const KEEP_RE = /keep existing/i;
const ADDED_RE = /is added to your test drive appointment/;

const VEHICLE: TestDriveVehicle = {
  vin: "3TMDZ5BN8NM126690",
  year: 2023,
  make: "Toyota",
  model: "Highlander",
  trim: "Hybrid Limited",
  title: "TOYOTA HIGHLANDER HYBRID LIMITED",
};

const APPOINTMENT: TestDriveAppointment = {
  id: "appt-1",
  dealerCode: "bay-ridge",
  dealerName: "Toyota of Bay Ridge",
  dealerAddress: "6401 6th Ave, Brooklyn, NY 11220",
  date: "2026-03-24",
  dayLabel: "Tomorrow",
  timeSlot: "12:00 PM",
  vehicles: [VEHICLE],
};

function makeBooking(overrides: Partial<UseTestDriveBookingResult>): UseTestDriveBookingResult {
  return {
    appointment: APPOINTMENT,
    close: vi.fn(),
    contactDisplay: "(***) ***-4325",
    currentVehicle: VEHICLE,
    dealerName: APPOINTMENT.dealerName,
    includesThisVin: true,
    isOpen: true,
    isSubmitting: false,
    onAddThisCar: vi.fn(),
    onKeepExisting: vi.fn(),
    onOpenManage: vi.fn(),
    onProceedSameDay: vi.fn(),
    onReplace: vi.fn(),
    onSelectSlot: vi.fn(),
    onSubmitIdentity: vi.fn(),
    onVerify: vi.fn(),
    selectedDate: APPOINTMENT.date,
    selectedSlot: "12:00 PM",
    step: "confirmation",
    ...overrides,
  };
}

describe("BookTestDriveModal", () => {
  it("renders the confirmation step", () => {
    render(<BookTestDriveModal booking={makeBooking({ step: "confirmation" })} />);
    expect(screen.getByText(CONFIRMED_RE)).toBeInTheDocument();
  });

  it("renders the identity step", () => {
    render(<BookTestDriveModal booking={makeBooking({ step: "identity" })} />);
    expect(screen.getByText("Book your test drive appointment")).toBeInTheDocument();
  });

  it("renders the verification step", () => {
    render(<BookTestDriveModal booking={makeBooking({ step: "verification" })} />);
    expect(screen.getByText("Enter verification code")).toBeInTheDocument();
  });

  it("renders the replace-conflict step with replace and keep actions", () => {
    render(<BookTestDriveModal booking={makeBooking({ step: "replace-conflict" })} />);
    expect(screen.getByText(SAME_TIME_RE)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: REPLACE_RE })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: KEEP_RE })).toBeInTheDocument();
  });

  it("renders the added-to-appointment step", () => {
    render(<BookTestDriveModal booking={makeBooking({ step: "added" })} />);
    expect(screen.getByText(ADDED_RE)).toBeInTheDocument();
  });
});
