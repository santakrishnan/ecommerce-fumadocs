/// <reference types="@testing-library/jest-dom" />
import { cleanup, render, screen } from "@ucmp/vitest-config/test-utils";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MEMBER_NAME_LABEL, MEMBER_SINCE_TEXT, MEMBER_YEAR } from "../member-id-card-constants";

const { mockCookies, mockGet } = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockGet: vi.fn(),
}));

const { mockGetProfileTier } = vi.hoisted(() => ({
  mockGetProfileTier: vi.fn(),
}));

const { mockGetProfileResolve } = vi.hoisted(() => ({
  mockGetProfileResolve: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("../../bff/use-cases/get-profile-tier", () => ({
  getProfileTier: mockGetProfileTier,
}));

vi.mock("../../bff/use-cases/get-profile-resolve", () => ({
  getProfileResolve: mockGetProfileResolve,
}));

vi.mock("@features/fingerprint/bff/fingerprint-cookie", () => ({
  decodeVisitorId: vi.fn(() => "test-fingerprint-id"),
}));

vi.mock("qrcode.react", () => ({
  QRCodeSVG: (props: Record<string, unknown>) => (
    <svg data-testid="member-qr-code" data-value={props.value as string} />
  ),
}));

beforeEach(() => {
  mockGet.mockReset();
  mockGet.mockReturnValue({ value: "test-fp-token" });
  mockCookies.mockResolvedValue({ get: mockGet });
  mockGetProfileTier.mockResolvedValue("t0");
  mockGetProfileResolve.mockResolvedValue({
    success: true,
    data: { firstSeenAt: "2025-01-15T00:00:00Z", customerId: null },
  });
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("MemberIdCardWrapper", () => {
  let MemberIdCardWrapper: typeof import("../member-id-card-wrapper").MemberIdCardWrapper;

  beforeAll(async () => {
    ({ MemberIdCardWrapper } = await import("../member-id-card-wrapper"));
  });

  it("renders in anonymous state (T0) without member label", async () => {
    mockGetProfileTier.mockResolvedValue("t0");

    const Component = await MemberIdCardWrapper();
    render(Component);

    expect(screen.queryByText(MEMBER_NAME_LABEL)).not.toBeInTheDocument();
  });

  it("renders in linked state (T2) with member label", async () => {
    mockGetProfileTier.mockResolvedValue("t2");

    const Component = await MemberIdCardWrapper();
    render(Component);

    expect(screen.getAllByText(MEMBER_NAME_LABEL).length).toBeGreaterThanOrEqual(1);
  });

  it("renders in linked state (T3) with member label", async () => {
    mockGetProfileTier.mockResolvedValue("t3");

    const Component = await MemberIdCardWrapper();
    render(Component);

    expect(screen.getAllByText(MEMBER_NAME_LABEL).length).toBeGreaterThanOrEqual(1);
  });

  it("renders member since year from firstSeenAt", async () => {
    mockGetProfileTier.mockResolvedValue("t2");
    mockGetProfileResolve.mockResolvedValue({
      success: true,
      data: { firstSeenAt: "2023-06-01T00:00:00Z", customerId: "cust-123" },
    });

    const Component = await MemberIdCardWrapper();
    render(Component);

    expect(screen.getByText(`${MEMBER_SINCE_TEXT} 2023`)).toBeInTheDocument();
  });

  it("renders empty memberSince when fingerprintId is missing", async () => {
    mockGetProfileTier.mockResolvedValue("t0");
    mockGet.mockReturnValue(undefined); // no fingerprint cookie

    const Component = await MemberIdCardWrapper();
    render(Component);

    // getProfileResolve not called, uses default MEMBER_YEAR
    expect(screen.getByText(`${MEMBER_SINCE_TEXT} ${MEMBER_YEAR}`)).toBeInTheDocument();
  });

  it("renders T1 without member label (not linked)", async () => {
    mockGetProfileTier.mockResolvedValue("t1");

    const Component = await MemberIdCardWrapper();
    render(Component);

    expect(screen.queryByText(MEMBER_NAME_LABEL)).not.toBeInTheDocument();
  });
});
