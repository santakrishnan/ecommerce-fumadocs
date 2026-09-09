/// <reference types="@testing-library/jest-dom" />

import { act } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { WatchlistVehicleItem } from "../watchlist-list";
import { WatchlistList } from "../watchlist-list";

// ─── Regex patterns (top-level for performance) ─────────────────────────────

const UNDO_PATTERN = /undo/i;
const REMOVED_PATTERN = /was removed from your Watchlist/i;
const RESTORED_PATTERN = /was restored to your Watchlist/i;

/**
 * Waits for Base UI's Menu popup to be fully removed from the DOM after a
 * close, so its `requestAnimationFrame`-driven position/close-transition
 * effects (`useAnimationsFinished` in Base UI internals) have genuinely
 * finished before the test advances time or ends.
 *
 * Under fake timers, `requestAnimationFrame` is faked too, so a lingering
 * open popup keeps rescheduling itself. If the fake clock is then jumped by
 * a large amount (e.g. the undo window's `vi.advanceTimersByTime(5000)`) or
 * the test simply ends while that loop is still live, the backlog of
 * virtual frames it needs to process can grow unbounded and OOM the worker,
 * especially under the parallel worker load of a full suite run.
 * `vi.waitFor` polls with the fake clock itself (unlike RTL's `waitFor`,
 * which needs the clock to auto-advance on its own), so this reliably
 * confirms the popup is gone rather than assuming a fixed number of ticks
 * was enough.
 */
async function waitForMenuToClose() {
  await vi.waitFor(() => {
    if (document.querySelector('[data-slot="dropdown-menu-content"]')) {
      throw new Error("menu popup is still in the DOM");
    }
  });
}

// ─── Mocks ──────────────────────────────────────────────────────────────────

// Mock next/image to a plain element (avoids Next.js image optimization in tests)
vi.mock("next/image", () => ({
  // biome-ignore lint/a11y/useAltText: test mock passes alt through props spread
  // biome-ignore lint/correctness/useImageSize: test mock passes dimensions through props spread
  // biome-ignore lint/performance/noImgElement: intentional plain img for test mock
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

// Mock @ucmp/ui/icons — spread real exports for transitive deps
vi.mock("@ucmp/ui/icons", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const stub = (props: Record<string, unknown>) => <svg {...props} />;
  return {
    ...actual,
    IconClose: stub,
    IconEdit: stub,
    IconSwitch: stub,
    IconBinocular: stub,
    IconCaretRight: stub,
    IconEllipsis: stub,
    IconInfo: stub,
    IconToyotaX: stub,
  };
});

// Mock utils (formatPrice, formatMileage)
vi.mock("utils", () => ({
  formatPrice: (n: number) => `$${n.toLocaleString()}`,
  formatMileage: (n: number) => `${n.toLocaleString()} mi`,
}));

// ─── Fixtures ───────────────────────────────────────────────────────────────

const item1: WatchlistVehicleItem = {
  vin: "JTMW1RFV5ND000001",
  title: "TOYOTA RAV4 XSE",
  imageSrc: "/img/rav4.jpg",
  imageAlt: "RAV4",
  cardProps: {
    imageAlt: "RAV4",
    imageSrc: "/img/rav4.jpg",
    make: "TOYOTA",
    model: "RAV4",
    trim: "XSE",
    year: 2024,
    mileage: 12_000,
    price: 29_245,
  },
};

const item2: WatchlistVehicleItem = {
  vin: "5TDGZRAH1PS000002",
  title: "TOYOTA HIGHLANDER XSE",
  imageSrc: "/img/highlander.jpg",
  imageAlt: "Highlander",
  cardProps: {
    imageAlt: "Highlander",
    imageSrc: "/img/highlander.jpg",
    make: "TOYOTA",
    model: "HIGHLANDER",
    trim: "XSE",
    year: 2024,
    mileage: 5000,
    price: 35_000,
  },
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("WatchlistList", () => {
  beforeEach(() => {
    // `shouldAdvanceTime: true` is required: React Testing Library's
    // `asyncWrapper` (which every `userEvent` call goes through) drains
    // microtasks via a bare `setTimeout(resolve, 0)` and only auto-advances
    // fake timers when it detects *Jest's* fake-timer API — a check that
    // never matches Vitest, so without a live auto-advancing clock every
    // `userEvent` call hangs forever.
    //
    // `requestAnimationFrame` is deliberately left off the `toFake` list.
    // Base UI's own animation-frame scheduler
    // (`@base-ui/utils/useAnimationFrame`) documents that a faked rAF can
    // be scheduled but isn't guaranteed to run before fake timers tear
    // down, leaving its internal scheduling state stuck and its callback
    // queue growing across interactions — unbounded allocation that can
    // OOM the worker. Leaving rAF on the real clock lets Base UI's Menu
    // position/focus-return frames actually run and drain themselves like
    // they would in a browser. `shouldClearNativeTimers` ensures the real
    // interval `shouldAdvanceTime` installs is torn down (not just
    // ignored) when `vi.useRealTimers()` runs in `afterEach`.
    vi.useFakeTimers({
      shouldAdvanceTime: true,
      shouldClearNativeTimers: true,
      toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"],
    });
  });

  afterEach(() => {
    // Flush any timers Base UI's Menu left pending (e.g. a close transition
    // from a test that doesn't itself await waitForMenuToClose) before
    // switching back to real timers, so it never straddles both clocks.
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("renders all vehicle cards initially", () => {
    const { container } = render(<WatchlistList items={[item1, item2]} />);

    const cards = container.querySelectorAll('[data-slot="watchlist-card"]');
    expect(cards).toHaveLength(2);
  });

  it("shows undo row after removing a vehicle via overflow menu", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(<WatchlistList items={[item1, item2]} undoWindowMs={5000} />);

    // Open overflow menu on first card
    const moreButtons = screen.getAllByLabelText("More options");
    await user.click(moreButtons[0] as HTMLElement);

    // Click "Remove from list"
    const removeItem = await screen.findByText("Remove from list");
    await user.click(removeItem);
    await waitForMenuToClose();

    // Card should be replaced by undo row
    expect(container.querySelector('[data-slot="watchlist-undo-row"]')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="watchlist-card"]')).toHaveLength(1);
  });

  it("restores the card when Undo is clicked", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(<WatchlistList items={[item1, item2]} undoWindowMs={5000} />);

    // Remove first card
    const moreButtons = screen.getAllByLabelText("More options");
    await user.click(moreButtons[0] as HTMLElement);
    const removeItem = await screen.findByText("Remove from list");
    await user.click(removeItem);
    await waitForMenuToClose();

    // Click Undo
    const undoButton = screen.getByRole("button", { name: UNDO_PATTERN });
    await user.click(undoButton);

    // Both cards should be back
    expect(container.querySelectorAll('[data-slot="watchlist-card"]')).toHaveLength(2);
    expect(container.querySelector('[data-slot="watchlist-undo-row"]')).not.toBeInTheDocument();
  });

  it("announces removal to assistive technology via aria-live region", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<WatchlistList items={[item1]} undoWindowMs={5000} />);

    // Remove card
    const moreButton = screen.getByLabelText("More options");
    await user.click(moreButton);
    const removeItem = await screen.findByText("Remove from list");
    await user.click(removeItem);
    await waitForMenuToClose();

    // Check live region announcement
    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toHaveTextContent(REMOVED_PATTERN);
  });

  it("announces restoration to assistive technology via aria-live region", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<WatchlistList items={[item1]} undoWindowMs={5000} />);

    // Remove then undo
    const moreButton = screen.getByLabelText("More options");
    await user.click(moreButton);
    const removeItem = await screen.findByText("Remove from list");
    await user.click(removeItem);
    await waitForMenuToClose();

    const undoButton = screen.getByRole("button", { name: UNDO_PATTERN });
    await user.click(undoButton);

    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toHaveTextContent(RESTORED_PATTERN);
  });

  it("calls onRemoveVehicle after undo window elapses", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<WatchlistList items={[item1]} onRemoveVehicle={onRemove} undoWindowMs={5000} />);

    // Remove card
    const moreButton = screen.getByLabelText("More options");
    await user.click(moreButton);
    const removeItem = await screen.findByText("Remove from list");
    await user.click(removeItem);
    await waitForMenuToClose();

    expect(onRemove).not.toHaveBeenCalled();

    // Advance past undo window
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith(item1.vin);
  });
});
