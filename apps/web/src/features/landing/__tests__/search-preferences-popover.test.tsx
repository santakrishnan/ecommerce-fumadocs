/// <reference types="@testing-library/jest-dom/vitest" />

import { render, screen, userEvent, waitFor } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { SearchPreferencesPopover } from "../components/search-prompt/search-preferences-popover";

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("@ucmp/ui", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  Chip: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  InputGroupButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  Popover: ({ children }: { children: React.ReactNode; open?: boolean }) => <>{children}</>,
  PopoverHeader: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  PopoverTitle: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props}>{children}</h2>
  ),
}));

vi.mock("@ucmp/ui/icons", () => ({
  IconClose: (props: React.SVGProps<SVGSVGElement>) => <svg aria-hidden="true" {...props} />,
  IconSearchContext: (props: React.SVGProps<SVGSVGElement>) => (
    <svg aria-hidden="true" {...props} />
  ),
  IconToyotaX: (props: React.SVGProps<SVGSVGElement>) => <svg aria-hidden="true" {...props} />,
}));

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

/**
 * Helper: wraps the component in the DOM structure the component needs to
 * find its portal target. The component traverses:
 *   triggerRef → closest("form") → closest("[class*='relative']")
 */
function renderInFormContext(ui: React.ReactElement) {
  return render(
    <div className="relative">
      <form onSubmit={(e) => e.preventDefault()}>{ui}</form>
    </div>
  );
}

describe("SearchPreferencesPopover", () => {
  // ─── Rendering ────────────────────────────────────────────────────────────

  describe("Rendering", () => {
    it("renders the trigger button", () => {
      renderInFormContext(<SearchPreferencesPopover />);
      expect(screen.getByRole("button", { name: "View search context" })).toBeInTheDocument();
    });

    it("does not show the panel when closed", () => {
      renderInFormContext(<SearchPreferencesPopover preferences={["SUV"]} />);
      // Panel is not visible until trigger is clicked
      expect(screen.queryByText("Your preferences")).not.toBeInTheDocument();
    });

    it("shows the panel with preferences when trigger is clicked", async () => {
      const user = userEvent.setup();
      renderInFormContext(
        <SearchPreferencesPopover
          explanationText="Use these preferences to narrow your results."
          preferences={["SUV"]}
        />
      );

      await user.click(screen.getByRole("button", { name: "View search context" }));

      await waitFor(() => {
        expect(screen.getByText("Your preferences")).toBeInTheDocument();
        expect(
          screen.getByText("Use these preferences to narrow your results.")
        ).toBeInTheDocument();
        expect(screen.getByText("SUV")).toBeInTheDocument();
      });
    });

    it("renders with empty preferences without crashing", async () => {
      const user = userEvent.setup();
      renderInFormContext(<SearchPreferencesPopover />);

      await user.click(screen.getByRole("button", { name: "View search context" }));

      await waitFor(() => {
        expect(screen.getByText("No active preferences.")).toBeInTheDocument();
      });
    });
  });

  // ─── Uncontrolled mode ────────────────────────────────────────────────────

  describe("Uncontrolled mode (no onDismissPreference prop)", () => {
    it("removes a preference from local state when dismissed", async () => {
      const user = userEvent.setup();
      renderInFormContext(<SearchPreferencesPopover preferences={["SUV", "Under $35k"]} />);

      // Open the panel
      await user.click(screen.getByRole("button", { name: "View search context" }));

      await waitFor(() => {
        expect(screen.getByText("SUV")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Remove SUV preference" }));

      expect(screen.queryByText("SUV")).not.toBeInTheDocument();
      expect(screen.getByText("Under $35k")).toBeInTheDocument();
    });

    it("keeps remaining preferences after a dismiss", async () => {
      const user = userEvent.setup();
      renderInFormContext(
        <SearchPreferencesPopover preferences={["SUV", "Under $35k", "Hybrid"]} />
      );

      await user.click(screen.getByRole("button", { name: "View search context" }));

      await waitFor(() => {
        expect(screen.getByText("Hybrid")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Remove Hybrid preference" }));

      expect(screen.getByText("SUV")).toBeInTheDocument();
      expect(screen.getByText("Under $35k")).toBeInTheDocument();
      expect(screen.queryByText("Hybrid")).not.toBeInTheDocument();
    });
  });

  // ─── Controlled mode ──────────────────────────────────────────────────────

  describe("Controlled mode (onDismissPreference prop provided)", () => {
    it("calls onDismissPreference with the removed item", async () => {
      const user = userEvent.setup();
      const onDismissPreference = vi.fn();
      renderInFormContext(
        <SearchPreferencesPopover
          onDismissPreference={onDismissPreference}
          preferences={["SUV", "Hybrid"]}
        />
      );

      await user.click(screen.getByRole("button", { name: "View search context" }));

      await waitFor(() => {
        expect(screen.getByText("SUV")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Remove SUV preference" }));

      expect(onDismissPreference).toHaveBeenCalledOnce();
      expect(onDismissPreference).toHaveBeenCalledWith("SUV");
    });

    it("does not remove from local state — prop owner controls the list", async () => {
      const user = userEvent.setup();
      const onDismissPreference = vi.fn();
      renderInFormContext(
        <SearchPreferencesPopover
          onDismissPreference={onDismissPreference}
          preferences={["SUV", "Hybrid"]}
        />
      );

      await user.click(screen.getByRole("button", { name: "View search context" }));

      await waitFor(() => {
        expect(screen.getByText("SUV")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Remove SUV preference" }));

      // List should still show both items because the prop hasn't changed
      expect(screen.getByText("SUV")).toBeInTheDocument();
      expect(screen.getByText("Hybrid")).toBeInTheDocument();
    });
  });

  // ─── onClose callbacks ────────────────────────────────────────────────────

  describe("onClose callback", () => {
    it("calls onClose when the close button is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderInFormContext(<SearchPreferencesPopover onClose={onClose} preferences={["SUV"]} />);

      // Open the panel
      await user.click(screen.getByRole("button", { name: "View search context" }));

      await waitFor(() => {
        expect(screen.getByText("Your preferences")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Close preferences panel" }));

      expect(onClose).toHaveBeenCalledOnce();
    });

    it("calls onClose when toggled closed via the trigger button", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderInFormContext(<SearchPreferencesPopover onClose={onClose} preferences={["SUV"]} />);

      // Open
      await user.click(screen.getByRole("button", { name: "View search context" }));
      await waitFor(() => {
        expect(screen.getByText("Your preferences")).toBeInTheDocument();
      });

      // Close by clicking trigger again
      await user.click(screen.getByRole("button", { name: "View search context" }));

      expect(onClose).toHaveBeenCalledOnce();
    });

    it("does not call onClose when the panel opens", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderInFormContext(<SearchPreferencesPopover onClose={onClose} preferences={["SUV"]} />);

      await user.click(screen.getByRole("button", { name: "View search context" }));

      await waitFor(() => {
        expect(screen.getByText("Your preferences")).toBeInTheDocument();
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("does not throw when onClose is not provided", async () => {
      const user = userEvent.setup();
      renderInFormContext(<SearchPreferencesPopover preferences={["SUV"]} />);

      // Open then close — should not throw
      await user.click(screen.getByRole("button", { name: "View search context" }));
      await waitFor(() => {
        expect(screen.getByText("Your preferences")).toBeInTheDocument();
      });

      await expect(
        user.click(screen.getByRole("button", { name: "Close preferences panel" }))
      ).resolves.not.toThrow();
    });
  });

  // ─── Portal rendering ─────────────────────────────────────────────────────

  describe("Portal rendering", () => {
    it("does not render panel content when no relative ancestor is found", async () => {
      const user = userEvent.setup();
      // Render WITHOUT the relative wrapper
      render(<SearchPreferencesPopover preferences={["SUV"]} />);

      await user.click(screen.getByRole("button", { name: "View search context" }));

      // Panel should not appear because portalTarget is null
      expect(screen.queryByText("Your preferences")).not.toBeInTheDocument();
    });

    it("renders panel content when relative ancestor exists", async () => {
      const user = userEvent.setup();
      renderInFormContext(<SearchPreferencesPopover preferences={["SUV"]} />);

      await user.click(screen.getByRole("button", { name: "View search context" }));

      await waitFor(() => {
        expect(screen.getByText("Your preferences")).toBeInTheDocument();
      });
    });
  });
});
