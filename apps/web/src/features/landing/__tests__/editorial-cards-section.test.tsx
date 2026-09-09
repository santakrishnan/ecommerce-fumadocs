/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { EditorialCardsSection } from "../components/editorial-cards-section";
import { EDITORIAL_CARDS_SEED } from "../data/editorial-cards";
import { getEditorialCards } from "../services/get-editorial-cards";

// ─── Mocks ──────────────────────────────────────────────────────────
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
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

vi.mock("../services/get-editorial-cards", () => ({
  getEditorialCards: vi.fn(),
}));

const mockedGetEditorialCards = vi.mocked(getEditorialCards);

afterEach(() => {
  vi.restoreAllMocks();
});

/** Helper: render the async Server Component by awaiting its JSX. */
async function renderEditorialCardsSection() {
  const ui = await EditorialCardsSection();
  return render(ui);
}

describe("EditorialCardsSection", () => {
  it("renders the carousel when data is available", async () => {
    mockedGetEditorialCards.mockResolvedValue({ success: true, data: EDITORIAL_CARDS_SEED });
    await renderEditorialCardsSection();

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(EDITORIAL_CARDS_SEED.length);
  });

  it("uses a <section> with aria-label='Curated collections' landmark", async () => {
    mockedGetEditorialCards.mockResolvedValue({ success: true, data: EDITORIAL_CARDS_SEED });
    const { container } = await renderEditorialCardsSection();

    const section = container.querySelector("section");
    expect(section).toHaveAttribute("aria-label", "Curated collections");
  });

  it("renders one editorial card per data item", async () => {
    mockedGetEditorialCards.mockResolvedValue({ success: true, data: EDITORIAL_CARDS_SEED });
    await renderEditorialCardsSection();

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(EDITORIAL_CARDS_SEED.length);
  });

  it("renders each card's headline as an h3", async () => {
    mockedGetEditorialCards.mockResolvedValue({ success: true, data: EDITORIAL_CARDS_SEED });
    await renderEditorialCardsSection();

    for (const card of EDITORIAL_CARDS_SEED) {
      expect(screen.getByRole("heading", { level: 3, name: card.headline })).toBeInTheDocument();
    }
  });

  it("renders nothing when success is false (section absent from DOM)", async () => {
    mockedGetEditorialCards.mockResolvedValue({ success: false, data: [] });
    const ui = await EditorialCardsSection();

    expect(ui).toBeNull();
  });

  it("renders nothing when data is an empty array (section absent from DOM)", async () => {
    mockedGetEditorialCards.mockResolvedValue({ success: true, data: [] });
    const ui = await EditorialCardsSection();

    expect(ui).toBeNull();
  });

  it("renders nothing on fetch failure (section absent from DOM)", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockedGetEditorialCards.mockRejectedValue(new Error("Network error"));
    const ui = await EditorialCardsSection();

    expect(ui).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[EditorialCardsSection] Failed to load cards",
      expect.any(Error)
    );
  });

  it("does not render any section landmark when data is absent", async () => {
    mockedGetEditorialCards.mockResolvedValue({ success: false, data: [] });
    const ui = await EditorialCardsSection();
    // When null, rendering produces an empty container
    const { container } = render(ui);

    expect(container.querySelector("section")).not.toBeInTheDocument();
  });

  it("does not render any headings or card links when data is empty", async () => {
    mockedGetEditorialCards.mockResolvedValue({ success: true, data: [] });
    const ui = await EditorialCardsSection();
    expect(ui).toBeNull();

    const { container } = render(ui);
    expect(container).toBeEmptyDOMElement();
  });

  it("calls getEditorialCards with no arguments", async () => {
    mockedGetEditorialCards.mockResolvedValue({ success: true, data: EDITORIAL_CARDS_SEED });
    await renderEditorialCardsSection();

    expect(mockedGetEditorialCards).toHaveBeenCalledWith();
  });
});
