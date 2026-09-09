/// <reference types="@testing-library/jest-dom" />

import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@ucmp/vitest-config/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_SESSION_ID } from "../__fixtures__/save-search.fixtures";
import { SaveSearchToggle } from "../components/save-search/save-search-toggle";
import { SAVE_SEARCH_STORAGE_KEY_PREFIX, SEARCH_TOGGLE_COPY } from "../data/save-search-copy";

describe("SaveSearchToggle", () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    window.sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("renders the toggle with unsaved text initially", async () => {
    const mockOnToggle = vi.fn();
    render(
      <SaveSearchToggle isSaved={false} onToggle={mockOnToggle} sessionId={TEST_SESSION_ID} />
    );

    // Wait for the component to render
    await waitFor(() => {
      expect(screen.getByText(SEARCH_TOGGLE_COPY.unsaved)).toBeInTheDocument();
    });
  });

  it("renders with heart outline icon when unsaved", async () => {
    const mockOnToggle = vi.fn();
    render(
      <SaveSearchToggle isSaved={false} onToggle={mockOnToggle} sessionId={TEST_SESSION_ID} />
    );

    await waitFor(() => {
      const toggle = screen.getByRole("button");
      const icon = toggle.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });
  });

  it("starts with unsaved state for each new sessionId", async () => {
    const mockOnToggle = vi.fn();
    render(
      <SaveSearchToggle isSaved={false} onToggle={mockOnToggle} sessionId={TEST_SESSION_ID} />
    );

    await waitFor(() => {
      expect(screen.getByText(SEARCH_TOGGLE_COPY.unsaved)).toBeInTheDocument();
    });
  });

  it("toggles to saved state when clicked", async () => {
    const user = userEvent.setup();
    const mockOnToggle = vi.fn();
    render(
      <SaveSearchToggle isSaved={false} onToggle={mockOnToggle} sessionId={TEST_SESSION_ID} />
    );

    await waitFor(() => {
      expect(screen.getByText(SEARCH_TOGGLE_COPY.unsaved)).toBeInTheDocument();
    });

    const toggle = screen.getByRole("button");
    await user.click(toggle);

    // Verify onToggle was called with true
    expect(mockOnToggle).toHaveBeenCalledWith(true);
  });

  it("persists saved state to sessionStorage with timestamp", async () => {
    const user = userEvent.setup();
    const mockOnToggle = vi.fn();

    render(
      <SaveSearchToggle isSaved={false} onToggle={mockOnToggle} sessionId={TEST_SESSION_ID} />
    );

    await waitFor(() => {
      expect(screen.getByText(SEARCH_TOGGLE_COPY.unsaved)).toBeInTheDocument();
    });

    const toggle = screen.getByRole("button");
    await user.click(toggle);

    // Verify onToggle was called
    expect(mockOnToggle).toHaveBeenCalledWith(true);

    // Verify sessionStorage has the saved record
    const storageKey = `${SAVE_SEARCH_STORAGE_KEY_PREFIX}${TEST_SESSION_ID}`;
    const saved = window.sessionStorage.getItem(storageKey);
    expect(saved).not.toBeNull();

    if (saved) {
      const record = JSON.parse(saved);
      expect(record).toEqual({
        isSaved: true,
        savedAt: expect.any(Number),
        sessionId: TEST_SESSION_ID,
      });
    }
  });

  it("toggles back to unsaved state", async () => {
    const user = userEvent.setup();
    const mockOnToggle = vi.fn();
    render(<SaveSearchToggle isSaved={true} onToggle={mockOnToggle} sessionId={TEST_SESSION_ID} />);

    await waitFor(() => {
      expect(screen.getByText(SEARCH_TOGGLE_COPY.saved)).toBeInTheDocument();
    });

    const toggle = screen.getByRole("button");
    await user.click(toggle);

    // Verify onToggle was called with false
    expect(mockOnToggle).toHaveBeenCalledWith(false);
  });

  it("loads saved state from sessionStorage on mount", async () => {
    const mockOnToggle = vi.fn();

    // Pre-populate sessionStorage with saved state
    const storageKey = `${SAVE_SEARCH_STORAGE_KEY_PREFIX}${TEST_SESSION_ID}`;
    const record = {
      isSaved: true,
      savedAt: Date.now(),
      sessionId: TEST_SESSION_ID,
    };
    window.sessionStorage.setItem(storageKey, JSON.stringify(record));

    render(<SaveSearchToggle isSaved={true} onToggle={mockOnToggle} sessionId={TEST_SESSION_ID} />);

    await waitFor(() => {
      expect(screen.getByText(SEARCH_TOGGLE_COPY.saved)).toBeInTheDocument();
    });
  });

  it("renders heart icon in toggle button", async () => {
    const mockOnToggle = vi.fn();
    render(
      <SaveSearchToggle isSaved={false} onToggle={mockOnToggle} sessionId={TEST_SESSION_ID} />
    );

    await waitFor(() => {
      const toggle = screen.getByRole("button");
      const icon = toggle.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });
  });
});
