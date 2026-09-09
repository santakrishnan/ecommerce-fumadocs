/// <reference types="@testing-library/jest-dom" />

import { sortOrderEnum } from "@ucmp/sdk-search-api";
import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { SearchFilterSortBy } from "../components/search-filters";

vi.mock("@/components/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} role="menuitem" type="button">
      {children}
    </button>
  ),
  DropdownMenuTrigger: ({ render }: { render: ReactNode }) => render,
}));

describe("SearchFilterSortBy", () => {
  it("shows Recommended as the default selected option", () => {
    render(<SearchFilterSortBy />);

    expect(screen.getByRole("button", { name: "Recommended" })).toBeInTheDocument();
  });

  it("renders all sort options when the menu opens", async () => {
    const user = userEvent.setup({ delay: null });

    render(<SearchFilterSortBy />);
    await user.click(screen.getByRole("button", { name: "Recommended" }));

    expect(screen.getByRole("menuitem", { name: "Recommended" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Lowest price" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Highest price" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Lowest mileage" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Newest year" })).toBeInTheDocument();
  });

  it("updates the selected option and calls onSortChange with the SortOrder value", async () => {
    const user = userEvent.setup({ delay: null });
    const onSortChange = vi.fn();

    render(<SearchFilterSortBy onSortChange={onSortChange} />);

    await user.click(screen.getByRole("button", { name: "Recommended" }));
    await user.click(screen.getByRole("menuitem", { name: "Lowest mileage" }));

    expect(screen.getByRole("button", { name: "Lowest mileage" })).toBeInTheDocument();
    expect(onSortChange).toHaveBeenCalledWith(sortOrderEnum.LowestMileage);
    expect(onSortChange).toHaveBeenCalledTimes(1);
  });

  it("shows the label matching the controlled value prop", () => {
    render(<SearchFilterSortBy value={sortOrderEnum.LowestPrice} />);

    expect(screen.getByRole("button", { name: "Lowest price" })).toBeInTheDocument();
  });

  it("reflects a controlled value change without user interaction", () => {
    const { rerender } = render(<SearchFilterSortBy value={sortOrderEnum.LowestPrice} />);
    expect(screen.getByRole("button", { name: "Lowest price" })).toBeInTheDocument();

    rerender(<SearchFilterSortBy value={sortOrderEnum.HighestPrice} />);
    expect(screen.getByRole("button", { name: "Highest price" })).toBeInTheDocument();
  });

  it("keeps the controlled value as the label after selecting an option", async () => {
    const user = userEvent.setup({ delay: null });
    const onSortChange = vi.fn();

    render(<SearchFilterSortBy onSortChange={onSortChange} value={sortOrderEnum.LowestPrice} />);

    await user.click(screen.getByRole("button", { name: "Lowest price" }));
    await user.click(screen.getByRole("menuitem", { name: "Newest year" }));

    // The parent owns the value, so the label stays until value updates.
    expect(screen.getByRole("button", { name: "Lowest price" })).toBeInTheDocument();
    expect(onSortChange).toHaveBeenCalledWith(sortOrderEnum.NewestYear);
  });

  it("does not call onSortChange when the already-active option is re-selected", async () => {
    const user = userEvent.setup({ delay: null });
    const onSortChange = vi.fn();

    render(<SearchFilterSortBy onSortChange={onSortChange} value={sortOrderEnum.LowestPrice} />);

    await user.click(screen.getByRole("menuitem", { name: "Lowest price" }));

    expect(onSortChange).not.toHaveBeenCalled();
  });
});
