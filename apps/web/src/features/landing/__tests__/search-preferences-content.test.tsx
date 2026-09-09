/// <reference types="@testing-library/jest-dom/vitest" />

import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { SearchPreferencesContent } from "../components/search-prompt/search-preferences-content";

vi.mock("@ucmp/ui", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  Chip: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div data-testid="chip" {...props}>
      {children}
    </div>
  ),
  PopoverHeader: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  PopoverTitle: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props}>{children}</h2>
  ),
}));

vi.mock("@ucmp/ui/icons", () => ({
  IconClose: (props: React.SVGProps<SVGSVGElement>) => <svg aria-hidden="true" {...props} />,
  IconToyotaX: (props: React.SVGProps<SVGSVGElement>) => <svg aria-hidden="true" {...props} />,
}));

describe("SearchPreferencesContent", () => {
  const explanationText = "Adjust your search preferences to refine results.";

  it("renders title, explanation text, and all preferences", () => {
    render(
      <SearchPreferencesContent
        explanationText={explanationText}
        onClose={vi.fn()}
        onDismissPreference={vi.fn()}
        onSave={vi.fn()}
        preferences={["Under $35k", "SUV", "2022 or newer"]}
      />
    );

    expect(screen.getByText("Your preferences")).toBeInTheDocument();
    expect(screen.getByText(explanationText)).toBeInTheDocument();
    expect(screen.getByText("Under $35k")).toBeInTheDocument();
    expect(screen.getByText("SUV")).toBeInTheDocument();
    expect(screen.getByText("2022 or newer")).toBeInTheDocument();
  });

  it("calls onDismissPreference with the selected preference", async () => {
    const user = userEvent.setup();
    const onDismissPreference = vi.fn();

    render(
      <SearchPreferencesContent
        explanationText={explanationText}
        onClose={vi.fn()}
        onDismissPreference={onDismissPreference}
        onSave={vi.fn()}
        preferences={["SUV"]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Remove SUV preference" }));

    expect(onDismissPreference).toHaveBeenCalledWith("SUV");
  });

  it("renders empty state when there are no preferences", () => {
    render(
      <SearchPreferencesContent
        explanationText={explanationText}
        onClose={vi.fn()}
        onDismissPreference={vi.fn()}
        onSave={vi.fn()}
        preferences={[]}
      />
    );

    expect(screen.getByText("No active preferences.")).toBeInTheDocument();
  });

  it("calls onClose when close preferences button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <SearchPreferencesContent
        explanationText={explanationText}
        onClose={onClose}
        onDismissPreference={vi.fn()}
        onSave={vi.fn()}
        preferences={["SUV"]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Close preferences panel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
