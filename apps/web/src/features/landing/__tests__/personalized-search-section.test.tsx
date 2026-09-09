/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { PersonalizedSearchSection } from "../components/personalized-search-section";
import { PERSONALIZED_SEARCH_CARDS_SEED } from "../data/personalized-search-cards";
import { getPersonalizedSearchCards } from "../services/get-personalized-search-cards";

// ─── Mocks ──────────────────────────────────────────────────────────
vi.mock("next/link", () => ({
  default: ({ children, href, prefetch, onNavigate, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { alt?: string; src?: string }) =>
    `[Image: ${alt ?? "no-alt"} src=${src ?? "none"}]`,
}));

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/server", () => ({
  connection: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../services/get-personalized-search-cards", () => ({
  getPersonalizedSearchCards: vi.fn(),
}));

const mockedGetCards = vi.mocked(getPersonalizedSearchCards);

/** Helper: render the async Server Component by awaiting its JSX. */
async function renderSection() {
  const ui = await PersonalizedSearchSection();
  if (!ui) {
    return render(<div data-testid="null-render" />);
  }
  return render(ui);
}

describe("PersonalizedSearchSection", () => {
  it("renders a section with correct aria-label", async () => {
    mockedGetCards.mockResolvedValue({ success: true, data: PERSONALIZED_SEARCH_CARDS_SEED });
    const { container } = await renderSection();

    const section = container.querySelector("section");
    expect(section).toHaveAttribute("aria-label", "Personalized search recommendations");
  });

  it("renders one card per data item", async () => {
    mockedGetCards.mockResolvedValue({ success: true, data: PERSONALIZED_SEARCH_CARDS_SEED });
    await renderSection();

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(PERSONALIZED_SEARCH_CARDS_SEED.length);
  });

  it("renders each card headline as an h3", async () => {
    mockedGetCards.mockResolvedValue({ success: true, data: PERSONALIZED_SEARCH_CARDS_SEED });
    await renderSection();

    for (const card of PERSONALIZED_SEARCH_CARDS_SEED) {
      expect(screen.getByRole("heading", { level: 3, name: card.headline })).toBeInTheDocument();
    }
  });

  it("returns null when success is false", async () => {
    mockedGetCards.mockResolvedValue({ success: false, data: [] });
    const { container } = await renderSection();

    expect(container.querySelector("section")).toBeNull();
  });

  it("returns null when data is empty", async () => {
    mockedGetCards.mockResolvedValue({ success: true, data: [] });
    const { container } = await renderSection();

    expect(container.querySelector("section")).toBeNull();
  });

  it("calls getPersonalizedSearchCards with no arguments", async () => {
    mockedGetCards.mockResolvedValue({ success: true, data: PERSONALIZED_SEARCH_CARDS_SEED });
    await renderSection();

    expect(mockedGetCards).toHaveBeenCalledWith();
  });

  describe("className wrapper (PEDX01-2683)", () => {
    it("renders wrapper div with className when data exists", async () => {
      mockedGetCards.mockResolvedValue({ success: true, data: PERSONALIZED_SEARCH_CARDS_SEED });

      const ui = await PersonalizedSearchSection({ className: "test-wrapper" });
      if (!ui) {
        throw new Error("Expected section to render with data");
      }
      const { container } = render(ui);

      expect(container.querySelector(".test-wrapper")).not.toBeNull();
      expect(container.querySelector("section")).not.toBeNull();
    });

    it("returns null when data is missing — no wrapper div in DOM", async () => {
      mockedGetCards.mockResolvedValue({ success: false, data: [] });

      const ui = await PersonalizedSearchSection({ className: "test-wrapper" });

      expect(ui).toBeNull();
    });
  });
});
