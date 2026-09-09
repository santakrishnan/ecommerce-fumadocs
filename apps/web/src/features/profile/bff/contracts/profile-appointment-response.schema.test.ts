// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  profileAppointmentResponseSchema,
  profileAppointmentSchema,
  profileAppointmentVehicleSchema,
} from "./profile-appointment-response.schema";

describe("profileAppointmentVehicleSchema", () => {
  it("accepts a valid vehicle with all fields", () => {
    const result = profileAppointmentVehicleSchema.safeParse({
      title: "TOYOTA HIGHLANDER HYBRID LIMITED",
      year: 2023,
      mileage: 36_435,
      imageUrl: "/images/vehicles/highlander.png",
      vin: "5TDKRKEC3PS093842",
      make: "Toyota",
      model: "Highlander",
      trim: "Hybrid Limited",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a vehicle without imageUrl and trim", () => {
    const result = profileAppointmentVehicleSchema.safeParse({
      title: "TOYOTA HIGHLANDER HYBRID LIMITED",
      year: 2023,
      mileage: 36_435,
      vin: "5TDKRKEC3PS093842",
      make: "Toyota",
      model: "Highlander",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a vehicle with negative mileage", () => {
    const result = profileAppointmentVehicleSchema.safeParse({
      title: "TOYOTA HIGHLANDER",
      year: 2023,
      mileage: -100,
      vin: "5TDKRKEC3PS093842",
      make: "Toyota",
      model: "Highlander",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a vehicle without a title", () => {
    const result = profileAppointmentVehicleSchema.safeParse({
      year: 2023,
      mileage: 36_435,
      vin: "5TDKRKEC3PS093842",
      make: "Toyota",
      model: "Highlander",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a vehicle without vin", () => {
    const result = profileAppointmentVehicleSchema.safeParse({
      title: "TOYOTA HIGHLANDER",
      year: 2023,
      mileage: 36_435,
      make: "Toyota",
      model: "Highlander",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a vehicle without make", () => {
    const result = profileAppointmentVehicleSchema.safeParse({
      title: "TOYOTA HIGHLANDER",
      year: 2023,
      mileage: 36_435,
      vin: "5TDKRKEC3PS093842",
      model: "Highlander",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a vehicle without model", () => {
    const result = profileAppointmentVehicleSchema.safeParse({
      title: "TOYOTA HIGHLANDER",
      year: 2023,
      mileage: 36_435,
      vin: "5TDKRKEC3PS093842",
      make: "Toyota",
    });
    expect(result.success).toBe(false);
  });
});

describe("profileAppointmentSchema", () => {
  const validTestDrive = {
    id: "appt-001",
    type: "test_drive",
    label: "Your test drive at Toyota of Bay Ridge",
    vehicles: [
      {
        title: "TOYOTA HIGHLANDER",
        year: 2023,
        mileage: 36_435,
        vin: "5TDKRKEC3PS093842",
        make: "Toyota",
        model: "Highlander",
      },
    ],
    dealershipName: "Toyota of Bay Ridge",
    dealershipAddress: "6401 6th Ave, Brooklyn, NY 11220",
    scheduledAt: "2026-08-10T12:30:00.000Z",
  };

  const validOffer = {
    id: "appt-002",
    type: "offer",
    label: "Your pre-qualified offer",
    vehicles: [
      {
        title: "TOYOTA HIGHLANDER",
        year: 2023,
        mileage: 36_435,
        vin: "5TDKRKEC3PS093842",
        make: "Toyota",
        model: "Highlander",
      },
    ],
    dealershipName: "Toyota of Bay Ridge",
    dealershipAddress: "6401 6th Ave, Brooklyn, NY 11220",
    expiresAt: "2026-08-09T02:00:00.000Z",
    monthlyPayment: 297,
    apr: 5.99,
    loanTermMonths: 60,
    downPayment: 2000,
    tradeInValue: 18_900,
    coBorrowerName: "Jane Smith",
  };

  it("accepts a valid test_drive appointment", () => {
    const result = profileAppointmentSchema.safeParse(validTestDrive);
    expect(result.success).toBe(true);
  });

  it("accepts a valid offer appointment", () => {
    const result = profileAppointmentSchema.safeParse(validOffer);
    expect(result.success).toBe(true);
  });

  it("rejects an invalid type", () => {
    const result = profileAppointmentSchema.safeParse({
      ...validTestDrive,
      type: "unknown_type",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when vehicles array is empty", () => {
    const result = profileAppointmentSchema.safeParse({
      ...validTestDrive,
      vehicles: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative monthlyPayment", () => {
    const result = profileAppointmentSchema.safeParse({
      ...validOffer,
      monthlyPayment: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid datetime for scheduledAt", () => {
    const result = profileAppointmentSchema.safeParse({
      ...validTestDrive,
      scheduledAt: "not-a-date",
    });
    expect(result.success).toBe(false);
  });
});

describe("profileAppointmentResponseSchema", () => {
  it("accepts an empty array", () => {
    const result = profileAppointmentResponseSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it("accepts an array of valid appointments", () => {
    const result = profileAppointmentResponseSchema.safeParse([
      {
        id: "appt-001",
        type: "test_drive",
        label: "Test drive",
        vehicles: [
          {
            title: "TOYOTA",
            year: 2023,
            mileage: 0,
            vin: "5TDKRKEC3PS093842",
            make: "Toyota",
            model: "Camry",
          },
        ],
        dealershipName: "Dealer",
        dealershipAddress: "123 Main St",
      },
    ]);
    expect(result.success).toBe(true);
  });

  it("rejects non-array input", () => {
    const result = profileAppointmentResponseSchema.safeParse({ id: "appt-001" });
    expect(result.success).toBe(false);
  });
});
