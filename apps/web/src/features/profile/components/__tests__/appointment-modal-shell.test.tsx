/// <reference types="@testing-library/jest-dom" />
import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";

import { PROFILE_APPOINTMENT_FIXTURES } from "../../bff/__fixtures__/profile-appointment.fixture";
import { AppointmentModalShell } from "../appointment-modal-shell";

const VIEW_ALL_BUTTON_PATTERN = /view all/i;
const APPOINTMENTS_LIST_PATTERN = /appointments and offers list/i;
const CLOSE_BUTTON_PATTERN = /^close$/i;
const APPOINTMENT_COUNT = PROFILE_APPOINTMENT_FIXTURES.length;

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt?: string; src?: string }) => (
    <div aria-label={alt} data-src={src} role="img" />
  ),
}));

describe("AppointmentModalShell", () => {
  it("opens and closes the appointments modal with the full appointment list", async () => {
    const user = userEvent.setup();
    const appointmentsHeadingPattern = new RegExp(
      `appointments & offers \\(${APPOINTMENT_COUNT}\\)`,
      "i"
    );
    render(<AppointmentModalShell appointments={PROFILE_APPOINTMENT_FIXTURES} />);

    expect(document.querySelectorAll('[data-slot="appointment-card"]')).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: VIEW_ALL_BUTTON_PATTERN }));

    expect(screen.getByText(appointmentsHeadingPattern)).toBeInTheDocument();
    expect(screen.getByRole("list", { name: APPOINTMENTS_LIST_PATTERN })).toBeInTheDocument();
    expect(document.querySelectorAll('[data-slot="appointment-modal-list-item"]')).toHaveLength(
      APPOINTMENT_COUNT
    );
    expect(document.querySelectorAll('[data-slot="appointment-card"]')).toHaveLength(
      APPOINTMENT_COUNT
    );

    await user.click(screen.getByRole("button", { name: CLOSE_BUTTON_PATTERN }));

    expect(document.querySelectorAll('[data-slot="appointment-card"]')).toHaveLength(0);
  });
});
