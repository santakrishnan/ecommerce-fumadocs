/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";

import type { ProfileAppointmentVehicle } from "../../bff/contracts/profile-appointment-response.schema";
import { AppointmentVehicles } from "../appointment-vehicles";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { alt?: string; src?: string }) =>
    `[Image: ${alt ?? "no-alt"} src=${src ?? "none"}]`,
}));

const VEHICLE_LINK_PATTERN = /view details for toyota highlander hybrid limited/i;

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const VALID_VEHICLE: ProfileAppointmentVehicle = {
  title: "TOYOTA HIGHLANDER HYBRID LIMITED",
  year: 2023,
  mileage: 36_435,
  imageUrl: "/images/profile/toyota-highlander-hybrid-limited.png",
  vin: "3TMDZ5BN8NM126690",
  make: "Toyota",
  model: "Highlander",
  trim: "Hybrid Limited",
};

const SECOND_VEHICLE: ProfileAppointmentVehicle = {
  title: "TOYOTA RAV4 HYBRID XSE",
  year: 2024,
  mileage: 12_500,
  imageUrl: "/images/profile/toyota-grand-highlander-xle.png",
  vin: "2T1BURHE8JC039175",
  make: "Toyota",
  model: "RAV4",
  trim: "Hybrid XSE",
};

describe("AppointmentVehicles", () => {
  it("renders nothing when vehicles array is empty", () => {
    const { container } = render(<AppointmentVehicles vehicles={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a single vehicle row as a link to VDP", () => {
    render(<AppointmentVehicles vehicles={[VALID_VEHICLE]} />);

    const link = screen.getByRole("link", {
      name: VEHICLE_LINK_PATTERN,
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "/used-cars/details/toyota/highlander/hybrid-limited/2023/3TMDZ5BN8NM126690"
    );
  });

  it("renders two vehicle rows each linked to their respective VDP", () => {
    render(<AppointmentVehicles vehicles={[VALID_VEHICLE, SECOND_VEHICLE]} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);

    expect(links[0]).toHaveAttribute(
      "href",
      "/used-cars/details/toyota/highlander/hybrid-limited/2023/3TMDZ5BN8NM126690"
    );
    expect(links[1]).toHaveAttribute(
      "href",
      "/used-cars/details/toyota/rav4/hybrid-xse/2024/2T1BURHE8JC039175"
    );
  });

  it("displays vehicle title, year, and mileage", () => {
    render(<AppointmentVehicles vehicles={[VALID_VEHICLE]} />);

    expect(screen.getByText("TOYOTA HIGHLANDER HYBRID LIMITED")).toBeInTheDocument();
    expect(screen.getByText("2023 • 36,435 mi")).toBeInTheDocument();
  });

  it("renders 3+ vehicles in compact layout without individual links", () => {
    const thirdVehicle: ProfileAppointmentVehicle = {
      title: "TOYOTA CAMRY SE",
      year: 2024,
      mileage: 5000,
      vin: "4T1G11AK5RU123456",
      make: "Toyota",
      model: "Camry",
      trim: "SE",
    };

    render(<AppointmentVehicles vehicles={[VALID_VEHICLE, SECOND_VEHICLE, thirdVehicle]} />);

    // With 3 vehicles, all are rendered as links (up to 5 vehicles max)
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(screen.getByText("TOYOTA CAMRY SE")).toBeInTheDocument();
  });

  it("renders vehicle row without link when VDP path cannot be built", () => {
    const vehicleWithInvalidVin: ProfileAppointmentVehicle = {
      title: "TOYOTA HIGHLANDER",
      year: 2023,
      mileage: 36_435,
      vin: "INVALID", // Too short — vdpSafe returns null
      make: "Toyota",
      model: "Highlander",
    };

    render(<AppointmentVehicles vehicles={[vehicleWithInvalidVin]} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("TOYOTA HIGHLANDER")).toBeInTheDocument();
  });
});
