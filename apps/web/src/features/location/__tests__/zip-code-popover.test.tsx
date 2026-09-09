/// <reference types="@testing-library/jest-dom" />
import { LOCATION_QUERY_KEY } from "@features/location";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, userEvent, waitFor } from "@ucmp/vitest-config/test-utils";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { zipCodePopoverEmpty, zipCodePopoverPrefilled } from "../__fixtures__/zip-code-popover";
import { ZipCodePopoverContent } from "../components/zip-code-popover";

const { mockUpdateZipCode, mockUpdateLocationFromCoords, mockRefresh } = vi.hoisted(() => ({
  mockUpdateZipCode: vi.fn(),
  mockUpdateLocationFromCoords: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock("../services/update-location", () => ({
  updateZipCode: mockUpdateZipCode,
  updateLocationFromCoords: mockUpdateLocationFromCoords,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

// ─── Regex constants ─────────────────────────────────────────────────
const USE_LOCATION_PATTERN = /use my current location/i;
const ZIP_PLACEHOLDER_PATTERN = /zip code/i;
const DESCRIPTION_PATTERN = /enter your zip code to see local inventory and pricing/i;

/** Renders inside a fresh QueryClientProvider and exposes the client for cache assertions. */
function renderWithClient(ui: ReactElement) {
  const queryClient = new QueryClient();
  const view = render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  return { queryClient, ...view };
}

describe("ZipCodePopoverContent", () => {
  beforeEach(() => {
    mockUpdateZipCode.mockReset();
    mockUpdateLocationFromCoords.mockReset();
    mockRefresh.mockReset();

    mockUpdateZipCode.mockResolvedValue({
      success: true,
      zip: "90210",
      city: "Beverly Hills",
      stateCode: "CA",
    });
    mockUpdateLocationFromCoords.mockResolvedValue({
      success: true,
      zip: "10001",
      city: "New York",
      stateCode: "NY",
    });
  });

  // ─── Layout & copy ──────────────────────────────────────────────

  it("renders the ZIP code input with placeholder", () => {
    renderWithClient(<ZipCodePopoverContent {...zipCodePopoverEmpty} />);
    expect(screen.getByPlaceholderText(ZIP_PLACEHOLDER_PATTERN)).toBeInTheDocument();
  });

  it("renders the description text", () => {
    renderWithClient(<ZipCodePopoverContent {...zipCodePopoverEmpty} />);
    expect(screen.getByText(DESCRIPTION_PATTERN)).toBeInTheDocument();
  });

  it("renders the 'Use my current location' button", () => {
    renderWithClient(<ZipCodePopoverContent {...zipCodePopoverEmpty} />);
    expect(screen.getByRole("button", { name: USE_LOCATION_PATTERN })).toBeInTheDocument();
  });

  it("pre-fills the input with the provided zipCode prop", () => {
    renderWithClient(<ZipCodePopoverContent {...zipCodePopoverPrefilled} />);
    expect(screen.getByPlaceholderText(ZIP_PLACEHOLDER_PATTERN)).toHaveValue("10001");
  });

  // ─── Input validation ────────────────────────────────────────────

  it("submit button is disabled when input has fewer than 5 digits", () => {
    renderWithClient(<ZipCodePopoverContent {...zipCodePopoverEmpty} />);
    const submitButton = document.querySelector("button[type='submit']") as HTMLButtonElement;
    expect(submitButton).toBeDisabled();
  });

  it("submit button is enabled when input has exactly 5 digits", async () => {
    const user = userEvent.setup();
    renderWithClient(<ZipCodePopoverContent {...zipCodePopoverEmpty} />);
    await user.type(screen.getByPlaceholderText(ZIP_PLACEHOLDER_PATTERN), "90210");

    const submitButton = document.querySelector("button[type='submit']") as HTMLButtonElement;
    expect(submitButton).toBeEnabled();
  });

  it("submit button is disabled when input is pre-filled to an invalid length", () => {
    renderWithClient(<ZipCodePopoverContent zipCode="123" />);
    const submitButton = document.querySelector("button[type='submit']") as HTMLButtonElement;
    expect(submitButton).toBeDisabled();
  });

  it("strips non-digit characters from input", async () => {
    const user = userEvent.setup();
    renderWithClient(<ZipCodePopoverContent {...zipCodePopoverEmpty} />);
    await user.type(screen.getByPlaceholderText(ZIP_PLACEHOLDER_PATTERN), "1a2b3");

    expect(screen.getByPlaceholderText(ZIP_PLACEHOLDER_PATTERN)).toHaveValue("123");
  });

  it("caps the input at 5 characters", async () => {
    const user = userEvent.setup();
    renderWithClient(<ZipCodePopoverContent {...zipCodePopoverEmpty} />);
    await user.type(screen.getByPlaceholderText(ZIP_PLACEHOLDER_PATTERN), "123456789");

    expect(screen.getByPlaceholderText(ZIP_PLACEHOLDER_PATTERN)).toHaveValue("12345");
  });

  // ─── Form submission ─────────────────────────────────────────────

  it("calls updateZipCode with the entered ZIP on form submit", async () => {
    const user = userEvent.setup();
    renderWithClient(<ZipCodePopoverContent {...zipCodePopoverEmpty} />);
    await user.type(screen.getByPlaceholderText(ZIP_PLACEHOLDER_PATTERN), "90210");

    const submitButton = document.querySelector("button[type='submit']") as HTMLButtonElement;
    await user.click(submitButton);

    await waitFor(() => expect(mockUpdateZipCode).toHaveBeenCalledWith("90210"));
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("resets the ['location'] cache from the action response before the refresh lands", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderWithClient(<ZipCodePopoverContent {...zipCodePopoverEmpty} />);
    await user.type(screen.getByPlaceholderText(ZIP_PLACEHOLDER_PATTERN), "90210");

    const submitButton = document.querySelector("button[type='submit']") as HTMLButtonElement;
    await user.click(submitButton);

    await waitFor(() =>
      expect(queryClient.getQueryData(LOCATION_QUERY_KEY)).toEqual({ zipCode: "90210" })
    );
  });

  it("calls onSuccess after a successful ZIP update", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    renderWithClient(<ZipCodePopoverContent {...zipCodePopoverEmpty} onSuccess={onSuccess} />);
    await user.type(screen.getByPlaceholderText(ZIP_PLACEHOLDER_PATTERN), "90210");

    const submitButton = document.querySelector("button[type='submit']") as HTMLButtonElement;
    await user.click(submitButton);

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("calls updateZipCode when the pre-filled ZIP is valid and the form is submitted", async () => {
    const user = userEvent.setup();
    renderWithClient(<ZipCodePopoverContent {...zipCodePopoverPrefilled} />);

    const submitButton = document.querySelector("button[type='submit']") as HTMLButtonElement;
    await user.click(submitButton);

    await waitFor(() => expect(mockUpdateZipCode).toHaveBeenCalledWith("10001"));
  });

  it("does not call updateZipCode when the input has fewer than 5 digits", async () => {
    const user = userEvent.setup();
    renderWithClient(<ZipCodePopoverContent {...zipCodePopoverEmpty} />);
    await user.type(screen.getByPlaceholderText(ZIP_PLACEHOLDER_PATTERN), "123");

    const submitButton = document.querySelector("button[type='submit']") as HTMLButtonElement;
    // Button is disabled — userEvent will not fire a click on a disabled button.
    await user.click(submitButton);

    expect(mockUpdateZipCode).not.toHaveBeenCalled();
  });

  // ─── Error handling ──────────────────────────────────────────────

  it("renders the action error, keeps the popover state, and skips onSuccess/refresh", async () => {
    mockUpdateZipCode.mockResolvedValue({
      success: false,
      error: "No location found for this zip code",
    });

    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const { queryClient } = renderWithClient(
      <ZipCodePopoverContent {...zipCodePopoverEmpty} onSuccess={onSuccess} />
    );
    await user.type(screen.getByPlaceholderText(ZIP_PLACEHOLDER_PATTERN), "99999");

    const submitButton = document.querySelector("button[type='submit']") as HTMLButtonElement;
    await user.click(submitButton);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "No location found for this zip code"
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(LOCATION_QUERY_KEY)).toBeUndefined();
  });

  it("clears the error as soon as the input changes", async () => {
    mockUpdateZipCode.mockResolvedValue({ success: false, error: "Lookup failed" });

    const user = userEvent.setup();
    renderWithClient(<ZipCodePopoverContent {...zipCodePopoverEmpty} />);
    await user.type(screen.getByPlaceholderText(ZIP_PLACEHOLDER_PATTERN), "99999");
    await user.click(document.querySelector("button[type='submit']") as HTMLButtonElement);
    await screen.findByRole("status");

    // The input is full (maxLength 5) — clearing it is what fires onChange.
    await user.clear(screen.getByPlaceholderText(ZIP_PLACEHOLDER_PATTERN));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  // ─── Geolocation ─────────────────────────────────────────────────

  it("calls updateLocationFromCoords with lat/lng when geolocation succeeds", async () => {
    const mockGetCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: { latitude: 40.71, longitude: -74.01 } as GeolocationCoordinates,
        timestamp: 0,
      } as GeolocationPosition);
    });

    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: { getCurrentPosition: mockGetCurrentPosition },
    });

    const user = userEvent.setup();
    renderWithClient(<ZipCodePopoverContent {...zipCodePopoverEmpty} />);
    await user.click(screen.getByRole("button", { name: USE_LOCATION_PATTERN }));

    await waitFor(() => expect(mockUpdateLocationFromCoords).toHaveBeenCalledWith(40.71, -74.01));
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("shows an error and does not call updateLocationFromCoords when geolocation is denied", async () => {
    const mockGetCurrentPosition = vi.fn(
      (_success: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 1, message: "User denied" } as GeolocationPositionError);
      }
    );

    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: { getCurrentPosition: mockGetCurrentPosition },
    });

    const user = userEvent.setup();
    renderWithClient(<ZipCodePopoverContent {...zipCodePopoverEmpty} />);
    await user.click(screen.getByRole("button", { name: USE_LOCATION_PATTERN }));

    expect(mockUpdateLocationFromCoords).not.toHaveBeenCalled();
    expect(await screen.findByRole("status")).toHaveTextContent(
      "We couldn't access your location. Enter a ZIP code instead."
    );
  });

  it("shows an error when navigator.geolocation is unavailable", async () => {
    vi.stubGlobal("navigator", { ...navigator, geolocation: undefined });
    const user = userEvent.setup();
    renderWithClient(<ZipCodePopoverContent {...zipCodePopoverEmpty} />);

    await user.click(screen.getByRole("button", { name: USE_LOCATION_PATTERN }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Location is not available in this browser."
    );
  });

  // ─── Concurrency guard ──────────────────────────────────────────

  it("does not call geolocation when a ZIP submission is pending", async () => {
    // Keep updateZipCode unresolved so the transition stays pending
    mockUpdateZipCode.mockReturnValue(
      new Promise(() => {
        /* never resolves */
      })
    );

    const mockGetCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: { latitude: 40.71, longitude: -74.01 } as GeolocationCoordinates,
        timestamp: 0,
      } as GeolocationPosition);
    });

    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: { getCurrentPosition: mockGetCurrentPosition },
    });

    const user = userEvent.setup();
    renderWithClient(<ZipCodePopoverContent {...zipCodePopoverEmpty} />);

    // Type a valid ZIP and submit to start a pending transition
    await user.type(screen.getByPlaceholderText(ZIP_PLACEHOLDER_PATTERN), "90210");
    const submitButton = document.querySelector("button[type='submit']") as HTMLButtonElement;
    await user.click(submitButton);

    // Click "Use my current location" while the ZIP update is still pending
    await user.click(screen.getByRole("button", { name: USE_LOCATION_PATTERN }));

    // Geolocation should never be invoked due to the concurrency guard
    expect(mockGetCurrentPosition).not.toHaveBeenCalled();
  });
});
