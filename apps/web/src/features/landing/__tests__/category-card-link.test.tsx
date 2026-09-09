/// <reference types="@testing-library/jest-dom" />
import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { categoryCardFixture } from "../__fixtures__/category-card.fixtures";
import { CategoryCardLink } from "../components/category-card/category-card-link";

vi.mock("next/image", () => ({
  default: ({ src }: { src?: string }) => <div data-src={src} data-testid="image" />,
}));

const mockOpenWithQuery = vi.fn();

vi.mock("../context/category-search-context", () => ({
  useCategorySearch: () => ({
    defaultQuery: "",
    isOpen: false,
    openWithQuery: mockOpenWithQuery,
    reset: vi.fn(),
  }),
}));

describe("CategoryCardLink", () => {
  it("renders the category name and description", () => {
    render(<CategoryCardLink data={categoryCardFixture} />);

    expect(screen.getByRole("heading", { level: 3, name: "TRUCKS" })).toBeInTheDocument();
    expect(
      screen.getByText("Power for every job, from daily commutes to heavy-duty hauling.")
    ).toBeInTheDocument();
  });

  it("renders an accessible link with aria-label", () => {
    render(<CategoryCardLink data={categoryCardFixture} />);

    expect(screen.getByRole("link", { name: "Shop TRUCKS" })).toBeInTheDocument();
  });

  it("calls openWithQuery with 'show me {lowercase name}' on click", async () => {
    const user = userEvent.setup();
    render(<CategoryCardLink data={categoryCardFixture} />);

    const link = screen.getByRole("link", { name: "Shop TRUCKS" });
    await user.click(link);

    expect(mockOpenWithQuery).toHaveBeenCalledWith("show me trucks");
  });

  it("prevents default link navigation on click", async () => {
    const user = userEvent.setup();
    render(<CategoryCardLink data={categoryCardFixture} />);

    const link = screen.getByRole("link", { name: "Shop TRUCKS" });
    await user.click(link);

    expect(link).toBeInTheDocument();
  });
});
