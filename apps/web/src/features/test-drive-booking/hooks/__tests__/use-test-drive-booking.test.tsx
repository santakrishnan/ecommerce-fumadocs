import type { VdpBookingState } from "@config/vdp-booking-state";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bookTestDriveAction } from "../../actions/book-test-drive";
import { buildExistingAppointment } from "../../data/scenario-appointments";
import { todayDateOnly } from "../../lib/format-appointment";
import type { TestDriveVehicle } from "../../schemas";
import { useTestDriveBooking } from "../use-test-drive-booking";

const mockSetProfileTier = vi.fn();

vi.mock("@features/demo-settings/actions/set-profile-tier", () => ({
  setProfileTier: (...args: unknown[]) => mockSetProfileTier(...args),
}));

vi.mock("../../actions/book-test-drive", () => ({
  bookTestDriveAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const mockBook = vi.mocked(bookTestDriveAction);

const CURRENT_VEHICLE: TestDriveVehicle = {
  vin: "3TMDZ5BN8NM126690",
  year: 2023,
  make: "Toyota",
  model: "Highlander",
  trim: "Hybrid Limited",
  title: "TOYOTA HIGHLANDER HYBRID LIMITED",
};

const DEALER = {
  dealerAddress: "6401 6th Ave, Brooklyn, NY 11220",
  dealerCode: "bay-ridge",
  dealerName: "Toyota of Bay Ridge",
};

const SLOTS = ["12:00 PM", "2:30 PM"];
const VALID_CONTACT = { firstName: "Jason", lastName: "Kaye", contact: "401-555-4325" };

function setup(state: VdpBookingState, requiresSignup = false) {
  const initialAppointment = buildExistingAppointment({
    ...DEALER,
    currentVehicle: CURRENT_VEHICLE,
    slots: SLOTS,
    state,
  });
  return renderHook(() =>
    useTestDriveBooking({
      currentVehicle: CURRENT_VEHICLE,
      ...DEALER,
      initialAppointment,
      requiresSignup,
      viewedDate: todayDateOnly(),
    })
  );
}

beforeEach(() => {
  mockBook.mockResolvedValue({ success: true, appointmentId: "td-mock" });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useTestDriveBooking", () => {
  it("no appointment: booking a slot confirms directly", async () => {
    const { result } = setup("no_appointment");
    await act(async () => {
      result.current.onSelectSlot("2:30 PM");
    });
    await waitFor(() => expect(result.current.step).toBe("confirmation"));
    expect(result.current.includesThisVin).toBe(true);
  });

  it("this_vin: appointment already includes the viewed vehicle", () => {
    const { result } = setup("this_vin");
    expect(result.current.includesThisVin).toBe(true);
  });

  it("same dealer, other vehicle: 'Add this car' merges into the visit", async () => {
    const { result } = setup("same_dealer_other_vin");
    expect(result.current.includesThisVin).toBe(false);
    await act(async () => {
      result.current.onAddThisCar();
    });
    await waitFor(() => expect(result.current.step).toBe("added"));
    expect(result.current.includesThisVin).toBe(true);
  });

  it("different dealer, same day, other time: shows the same-day reminder then proceeds", async () => {
    const { result } = setup("different_dealer");
    act(() => {
      result.current.onSelectSlot("2:30 PM");
    });
    expect(result.current.step).toBe("same-day-reminder");
    await act(async () => {
      await result.current.onProceedSameDay();
    });
    await waitFor(() => expect(result.current.step).toBe("confirmation"));
  });

  it("duplicate slot: prompts, then replaces the existing appointment (reuses its id)", async () => {
    const { result } = setup("different_dealer");
    act(() => {
      result.current.onSelectSlot("12:00 PM");
    });
    expect(result.current.step).toBe("replace-conflict");
    await act(async () => {
      await result.current.onReplace();
    });
    await waitFor(() => expect(result.current.step).toBe("confirmation"));
    expect(result.current.includesThisVin).toBe(true);
    // Replace must reuse the conflicting appointment's id so the upsert overwrites
    // it (rather than appending a duplicate).
    const lastArg = mockBook.mock.calls.at(-1)?.[0] as { id: string } | undefined;
    expect(lastArg?.id).toBe("td-existing-different-dealer");
  });

  it("duplicate slot: keep existing closes without booking", () => {
    const { result } = setup("different_dealer");
    act(() => {
      result.current.onSelectSlot("12:00 PM");
    });
    act(() => {
      result.current.onKeepExisting();
    });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.includesThisVin).toBe(false);
  });

  it("anonymous: slot select opens sign-up, then OTP converts the tier and completes the booking", async () => {
    const { result } = setup("no_appointment", true);

    act(() => {
      result.current.onSelectSlot("2:30 PM");
    });
    expect(result.current.step).toBe("identity");

    act(() => {
      result.current.onSubmitIdentity(VALID_CONTACT);
    });
    expect(result.current.step).toBe("verification");

    await act(async () => {
      await result.current.onVerify();
    });
    expect(mockSetProfileTier).toHaveBeenCalledWith("t1");
    await waitFor(() => expect(result.current.step).toBe("confirmation"));
    expect(result.current.includesThisVin).toBe(true);
  });
});
