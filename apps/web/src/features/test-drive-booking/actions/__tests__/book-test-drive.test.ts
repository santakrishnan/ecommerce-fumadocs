import { beforeEach, describe, expect, it, vi } from "vitest";
import { bookTestDriveAction } from "../book-test-drive";

const mockGet = vi.fn();
const mockSet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: mockGet, set: mockSet }),
}));

const mockRevalidateTag = vi.fn();

vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
}));

const VIN = "3TMDZ5BN8NM126690";
const OTHER_VIN = "2T3P1RFV8NW300112";

function appointment(id: string, vin: string) {
  return {
    id,
    dealerCode: "bay-ridge",
    dealerName: "Toyota of Bay Ridge",
    dealerAddress: "6401 6th Ave, Brooklyn, NY 11220",
    date: "2026-03-24",
    dayLabel: "Tomorrow",
    timeSlot: "12:00 PM",
    vehicles: [
      {
        vin,
        year: 2023,
        make: "Toyota",
        model: "Highlander",
        trim: "Hybrid Limited",
        title: "TOYOTA HIGHLANDER HYBRID LIMITED",
      },
    ],
  };
}

function lastSetPayload(): string {
  const call = mockSet.mock.calls.at(-1);
  return String(call?.[1] ?? "");
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGet.mockReturnValue(undefined);
});

describe("bookTestDriveAction", () => {
  it("rejects invalid input", async () => {
    const result = await bookTestDriveAction({ dealerCode: "x" });
    expect(result.success).toBe(false);
  });

  it("persists a new booking into an empty list", async () => {
    const result = await bookTestDriveAction(appointment("td-1", VIN));
    expect(result.success).toBe(true);
    expect(mockSet).toHaveBeenCalledWith(
      "demo-vdp-booking",
      expect.stringContaining(VIN),
      expect.objectContaining({ path: "/" })
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith("profile-appointments", "max");
  });

  it("appends a second booking, keeping the first", async () => {
    mockGet.mockReturnValue({ value: JSON.stringify([appointment("td-1", VIN)]) });
    await bookTestDriveAction(appointment("td-2", OTHER_VIN));
    const payload = lastSetPayload();
    expect(payload).toContain(VIN);
    expect(payload).toContain(OTHER_VIN);
  });

  it("upserts an existing booking by id instead of duplicating", async () => {
    mockGet.mockReturnValue({ value: JSON.stringify([appointment("td-1", VIN)]) });
    await bookTestDriveAction(appointment("td-1", OTHER_VIN));
    const parsed = JSON.parse(lastSetPayload()) as unknown[];
    expect(parsed).toHaveLength(1);
  });
});
