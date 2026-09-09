/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { TestDriveAppointment } from "../../schemas";
import { BookingSummary } from "../booking-summary";

const MANAGE_RE = /manage appointment/i;
const ADD_THIS_CAR_RE = /add this car/i;
const VEHICLE_LABEL_RE = /2023 Toyota Highlander Hybrid Limited/;

const APPOINTMENT: TestDriveAppointment = {
  id: "appt-1",
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
      trim: "Hybrid Limited",
      title: "TOYOTA HIGHLANDER HYBRID LIMITED",
    },
  ],
};

describe("BookingSummary", () => {
  it("renders the confirmed state with a manage action", () => {
    render(
      <BookingSummary
        appointment={APPOINTMENT}
        mode="confirmed"
        onAddThisCar={vi.fn()}
        onManage={vi.fn()}
      />
    );

    expect(screen.getByText("Your test drive is confirmed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: MANAGE_RE })).toBeInTheDocument();
  });

  it("renders the add-car state with the existing vehicle and an add action", () => {
    render(
      <BookingSummary
        appointment={APPOINTMENT}
        mode="add-car"
        onAddThisCar={vi.fn()}
        onManage={vi.fn()}
      />
    );

    expect(screen.getByText("Add to your upcoming test drive visit")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ADD_THIS_CAR_RE })).toBeInTheDocument();
    expect(screen.getByText(VEHICLE_LABEL_RE)).toBeInTheDocument();
  });
});
