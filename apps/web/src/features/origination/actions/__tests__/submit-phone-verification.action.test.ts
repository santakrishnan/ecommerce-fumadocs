// @vitest-environment node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ORIGINATION_APPLICATION_FIXTURE } from "../../bff/__fixtures__/patch-origination.fixture";

const { mockPatchOrigination, mockReadVisitorIdentity } = vi.hoisted(() => ({
  mockPatchOrigination: vi.fn(),
  mockReadVisitorIdentity: vi.fn(),
}));

vi.mock("@shared/lib/http/bed-identity", () => ({
  readVisitorIdentity: mockReadVisitorIdentity,
}));
vi.mock("../../bff/use-cases/patch-origination", () => ({
  patchOrigination: mockPatchOrigination,
}));

import { submitPhoneVerificationAction } from "../submit-phone-verification.action";

const PHONE = "5551234567";
const ORIGINATION_ID = ORIGINATION_APPLICATION_FIXTURE.originationId;
const IDENTITY = { visitorId: "visitor-1", sessionId: "session-1" };

describe("submitPhoneVerificationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("USE_ORIGINATION_MOCKS", "true");
    mockReadVisitorIdentity.mockResolvedValue(IDENTITY);
    mockPatchOrigination.mockResolvedValue({
      success: true,
      data: ORIGINATION_APPLICATION_FIXTURE,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns a validation Result without calling patchOrigination for malformed input", async () => {
    const result = await submitPhoneVerificationAction(ORIGINATION_ID, {
      channel: "sms",
      phone: "not-a-phone",
    });

    expect(result).toEqual({
      success: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Enter a valid 10-digit phone number",
        status: 400,
      },
    });
    expect(mockReadVisitorIdentity).not.toHaveBeenCalled();
    expect(mockPatchOrigination).not.toHaveBeenCalled();
  });

  it("records only the phone step transition and drops the raw phone", async () => {
    const consoleMethods = [
      vi.spyOn(console, "error"),
      vi.spyOn(console, "warn"),
      vi.spyOn(console, "log"),
    ];

    const result = await submitPhoneVerificationAction(ORIGINATION_ID, {
      channel: "sms",
      phone: PHONE,
    });

    expect(result).toEqual({ success: true, data: ORIGINATION_APPLICATION_FIXTURE });
    expect(mockReadVisitorIdentity).toHaveBeenCalledOnce();
    expect(mockPatchOrigination).toHaveBeenCalledWith(
      { originationId: ORIGINATION_ID, step: "phone-verification", status: "completed" },
      expect.any(String),
      IDENTITY
    );
    expect(mockPatchOrigination.mock.calls.flat()).not.toContain(PHONE);
    expect(consoleMethods.flatMap((method) => method.mock.calls)).not.toContainEqual(
      expect.arrayContaining([PHONE])
    );
  });

  it("uses the shared phone contract for both server and content validation", () => {
    const actionSource = readFileSync(
      resolve(import.meta.dirname, "..", "submit-phone-verification.action.ts"),
      "utf8"
    );
    const formSource = readFileSync(
      resolve(import.meta.dirname, "..", "..", "lib", "phone-form-schema.ts"),
      "utf8"
    );

    expect(actionSource).toContain("phoneVerificationRequestSchema.safeParse(rawInput)");
    expect(formSource).toContain(".pipe(phoneVerificationRequestSchema.shape.phone)");
  });
});
