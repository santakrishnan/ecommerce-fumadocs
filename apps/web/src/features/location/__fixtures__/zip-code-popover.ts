import type { ZipCodePopoverContentProps } from "../components/zip-code-popover";

/** Base props without the callback — add onZipCodeChange per-test via vi.fn(). */
type ZipCodePopoverFixture = Omit<ZipCodePopoverContentProps, "onZipCodeChange">;

/** Pre-filled with a valid 5-digit ZIP code. */
export const zipCodePopoverPrefilled: ZipCodePopoverFixture = {
  zipCode: "10001",
};

/** Empty initial ZIP — simulates first-time entry. */
export const zipCodePopoverEmpty: ZipCodePopoverFixture = {
  zipCode: "",
};
