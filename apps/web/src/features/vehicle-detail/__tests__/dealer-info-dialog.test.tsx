/// <reference types="@testing-library/jest-dom" />

import { QueryClientProvider } from "@tanstack/react-query";
import {
  createTestQueryClient,
  render,
  screen,
  userEvent,
  waitFor,
} from "@ucmp/vitest-config/test-utils";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEALER_INSIGHT_DEFAULT_FIXTURE } from "../bff/__fixtures__/dealer-insight-response.fixture";
import { DealerInfoDialog } from "../components/dealer-info-dialog";

// ─── Setup ────────────────────────────────────────────────────────────────────

const TEST_DEALER_CODE = "5012";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function mockDealerInsightSuccess() {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(DEALER_INSIGHT_DEFAULT_FIXTURE), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  );
}

function mockDealerInsightError() {
  fetchMock.mockResolvedValueOnce(
    new Response(
      JSON.stringify({ error: { code: "VDP_UPSTREAM_UNAVAILABLE", message: "Unavailable" } }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    )
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("DealerInfoDialog", () => {
  function renderDialog() {
    const user = userEvent.setup();
    render(
      <DealerInfoDialog
        dealerCode={TEST_DEALER_CODE}
        trigger={<button type="button">View dealer</button>}
      />,
      { wrapper: createWrapper() }
    );
    return { user };
  }

  it("renders the trigger button", () => {
    mockDealerInsightSuccess();
    renderDialog();
    expect(screen.getByRole("button", { name: "View dealer" })).toBeInTheDocument();
  });

  it("opens dialog when trigger is clicked", async () => {
    mockDealerInsightSuccess();
    const { user } = renderDialog();
    await user.click(screen.getByRole("button", { name: "View dealer" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("calls the BFF endpoint with the dealerCode on open", async () => {
    mockDealerInsightSuccess();
    const { user } = renderDialog();
    await user.click(screen.getByRole("button", { name: "View dealer" }));

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/v1/dealer-insight/${TEST_DEALER_CODE}`,
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("shows loading skeleton while fetching", async () => {
    // Don't resolve the fetch — keep it pending
    fetchMock.mockReturnValueOnce(
      new Promise(() => {
        /* intentionally never resolves */
      })
    );
    const { user } = renderDialog();
    await user.click(screen.getByRole("button", { name: "View dealer" }));

    expect(screen.getByTestId("dealer-info-loading")).toBeInTheDocument();
  });

  it("displays dealer name after successful fetch", async () => {
    mockDealerInsightSuccess();
    const { user } = renderDialog();
    await user.click(screen.getByRole("button", { name: "View dealer" }));

    await waitFor(() => {
      const headings = screen.getAllByText(DEALER_INSIGHT_DEFAULT_FIXTURE.dealer.dealerName);
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("displays rating with review source", async () => {
    mockDealerInsightSuccess();
    const { user } = renderDialog();
    await user.click(screen.getByRole("button", { name: "View dealer" }));

    await waitFor(() => {
      const { rating } = DEALER_INSIGHT_DEFAULT_FIXTURE.dealer;
      expect(screen.getByText(String(rating?.value))).toBeInTheDocument();
      expect(
        screen.getByText(`${rating?.reviewCount.toLocaleString()} ${rating?.reviewSource} reviews`)
      ).toBeInTheDocument();
    });
  });

  it("displays the formatted address", async () => {
    mockDealerInsightSuccess();
    const { user } = renderDialog();
    await user.click(screen.getByRole("button", { name: "View dealer" }));

    const { address } = DEALER_INSIGHT_DEFAULT_FIXTURE.dealer;
    await waitFor(() => {
      expect(
        screen.getByText(
          `${address.line1}, ${address.city}, ${address.state} ${address.postalCode}`
        )
      ).toBeInTheDocument();
    });
  });

  it("renders phone as a tappable tel: link", async () => {
    mockDealerInsightSuccess();
    const { user } = renderDialog();
    await user.click(screen.getByRole("button", { name: "View dealer" }));

    const { phone } = DEALER_INSIGHT_DEFAULT_FIXTURE.dealer;
    if (phone === null) {
      throw new Error("Expected fixture to have a phone number");
    }

    await waitFor(() => {
      const phoneLink = screen.getByRole("link", { name: phone });
      expect(phoneLink).toBeInTheDocument();
      expect(phoneLink).toHaveAttribute("href", `tel:${phone}`);
    });
  });

  it("displays grouped operating hours", async () => {
    mockDealerInsightSuccess();
    const { user } = renderDialog();
    await user.click(screen.getByRole("button", { name: "View dealer" }));

    const statusText = DEALER_INSIGHT_DEFAULT_FIXTURE.dealer.hours?.statusText;
    if (statusText === undefined) {
      throw new Error("Expected fixture to have hours.statusText");
    }

    await waitFor(() => {
      expect(screen.getByText(statusText as string)).toBeInTheDocument();
    });
  });

  it("shows error state when fetch fails", async () => {
    mockDealerInsightError();
    const { user } = renderDialog();
    await user.click(screen.getByRole("button", { name: "View dealer" }));

    await waitFor(() => {
      expect(screen.getByTestId("dealer-info-error")).toBeInTheDocument();
    });
  });

  it("closes dialog on ESC key", async () => {
    mockDealerInsightSuccess();
    const { user } = renderDialog();
    await user.click(screen.getByRole("button", { name: "View dealer" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
