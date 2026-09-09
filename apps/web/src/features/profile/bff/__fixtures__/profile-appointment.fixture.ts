import type { ProfileAppointment } from "../contracts/profile-appointment-response.schema";

// ─── Date Helpers ────────────────────────────────────────────────────────────
// Keep all fixture dates relative to now so they never silently go stale.

/** Returns an ISO string N days from now at the given hour (UTC). */
function futureDate(daysFromNow: number, hour = 12): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setUTCHours(hour, 30, 0, 0);
  return d.toISOString();
}

/**
 * Test drive appointment fixture (T2) — single vehicle.
 */
export const TEST_DRIVE_SINGLE_VEHICLE_FIXTURE: ProfileAppointment = {
  id: "appt-td-001",
  type: "test_drive",
  label: "Your test drive at Toyota of Bay Ridge",
  vehicles: [
    {
      title: "TOYOTA HIGHLANDER HYBRID LIMITED",
      year: 2023,
      mileage: 36_435,
      imageUrl: "/images/profile/toyota-highlander-hybrid-limited.png",
      vin: "3TMDZ5BN8NM126690",
      make: "Toyota",
      model: "Highlander",
      trim: "Hybrid Limited",
    },
  ],
  dealershipName: "Toyota of Bay Ridge",
  dealershipAddress: "6401 6th Ave, Brooklyn, NY 11220",
  scheduledAt: futureDate(6, 12),
};

/**
 * Test drive appointment fixture (T2) — two vehicles.
 * Covers the multi-vehicle thumbnail layout.
 */
export const TEST_DRIVE_TWO_VEHICLES_FIXTURE: ProfileAppointment = {
  id: "appt-td-002",
  type: "test_drive",
  label: "Your test drive at Toyota of Bay Ridge",
  vehicles: [
    {
      title: "TOYOTA HIGHLANDER HYBRID LIMITED",
      year: 2023,
      mileage: 36_435,
      imageUrl: "/images/profile/toyota-highlander-hybrid-limited.png",
      vin: "3TMDZ5BN8NM126690",
      make: "Toyota",
      model: "Highlander",
      trim: "Hybrid Limited",
    },
    {
      title: "TOYOTA RAV4 HYBRID XSE",
      year: 2024,
      mileage: 12_500,
      imageUrl: "/images/profile/toyota-grand-highlander-xle.png",
      vin: "2T1BURHE8JC039175",
      make: "Toyota",
      model: "RAV4",
      trim: "Hybrid XSE",
    },
  ],
  dealershipName: "Toyota of Bay Ridge",
  dealershipAddress: "6401 6th Ave, Brooklyn, NY 11220",
  scheduledAt: futureDate(8, 10),
};

/**
 * Offer appointment fixture (T3) — single vehicle.
 */
export const OFFER_SINGLE_VEHICLE_FIXTURE: ProfileAppointment = {
  id: "appt-offer-001",
  type: "offer",
  label: "Your appointment at Toyota of Bay Ridge",
  vehicles: [
    {
      title: "TOYOTA HIGHLANDER HYBRID LIMITED",
      year: 2023,
      mileage: 36_435,
      imageUrl: "/images/profile/toyota-highlander-hybrid-limited.png",
      vin: "5TDKZRFH8NS112233",
      make: "Toyota",
      model: "Highlander",
      trim: "Hybrid Limited",
    },
  ],
  dealershipName: "Toyota of Bay Ridge",
  dealershipAddress: "6401 6th Ave, Brooklyn, NY 11220",
  scheduledAt: "2026-08-10T12:30:00.000Z",
  expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000).toISOString(),
  monthlyPayment: 297,
  apr: 5.99,
  loanTermMonths: 60,
  downPayment: 2000,
  tradeInValue: 18_900,
  coBorrowerName: "Jane Smith",
};

/**
 * Vehicle sold fixture — cancelled appointment.
 */
export const VEHICLE_SOLD_FIXTURE: ProfileAppointment = {
  id: "appt-sold-001",
  type: "vehicle_sold",
  label: "This 2023 Highlander Hybrid Limited has sold.",
  vehicles: [
    {
      title: "TOYOTA HIGHLANDER HYBRID LIMITED",
      year: 2023,
      mileage: 36_435,
      vin: "JTMRWRFV8ND778899",
      make: "Toyota",
      model: "Highlander",
      trim: "Hybrid Limited",
    },
  ],
  dealershipName: "Toyota of Bay Ridge",
  dealershipAddress: "6401 6th Ave, Brooklyn, NY 11220",
  soldMessage: "We cancelled your test drive for June 11th at Toyota of Bay Ridge.",
};

/**
 * All appointment fixtures — used by the mock service.
 * First entry is shown on the profile page; full list is for the modal (Ticket 4b).
 */
export const PROFILE_APPOINTMENT_FIXTURES: ProfileAppointment[] = [
  TEST_DRIVE_SINGLE_VEHICLE_FIXTURE,
  TEST_DRIVE_TWO_VEHICLES_FIXTURE,
  OFFER_SINGLE_VEHICLE_FIXTURE,
  VEHICLE_SOLD_FIXTURE,
];
