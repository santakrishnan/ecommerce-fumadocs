import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import {
  categoryCardFixture,
  categoryCardsListFixture,
} from "../__fixtures__/category-card.fixtures";
import { CategoryCard } from "../components/category-card/category-card";

const FIXED_WIDTH_RE = /\bw-\[\d+px\]/;
const FIXED_HEIGHT_RE = /\bh-\[\d+px\]/;

describe("CategoryCard", () => {
  it("renders category name as <h3> with correct token classes", () => {
    render(<CategoryCard data={categoryCardFixture} />);

    const heading = screen.getByRole("heading", { level: 3, name: "TRUCKS" });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass("h3");
  });

  it("renders description text", () => {
    render(<CategoryCard data={categoryCardFixture} />);

    expect(
      screen.getByText("Power for every job, from daily commutes to heavy-duty hauling.")
    ).toBeInTheDocument();
  });

  it("renders the link surface as an <a> element with href equal to data.shopUrl", () => {
    render(<CategoryCard data={categoryCardFixture} />);

    const link = screen.getByRole("link", { name: "Shop TRUCKS" });
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/search?type=truck");
  });

  it("renders the link with aria-label 'Shop {data.name}'", () => {
    render(<CategoryCard data={categoryCardFixture} />);

    const link = screen.getByRole("link", { name: "Shop TRUCKS" });
    expect(link).toHaveAttribute("aria-label", "Shop TRUCKS");
  });

  it("does not nest an <a> inside the card link", () => {
    render(<CategoryCard data={categoryCardFixture} />);

    const link = screen.getByRole("link", { name: "Shop TRUCKS" });
    const nestedLinks = link.querySelectorAll("a");
    expect(nestedLinks).toHaveLength(0);
  });

  it("renders 'Shop now' label as a presentational span (not a link or button)", () => {
    render(<CategoryCard data={categoryCardFixture} />);

    const shopNow = screen.getByText("Shop now");
    expect(shopNow).toBeInTheDocument();
    expect(shopNow.tagName).toBe("SPAN");
  });

  it("renders image with descriptive alt text", () => {
    const { container } = render(<CategoryCard data={categoryCardFixture} />);

    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("alt", "Toyota truck side view");
  });

  it("applies rounded-xl on the wrapper and bg-surface-primary on the link surface", () => {
    const { container } = render(<CategoryCard data={categoryCardFixture} />);

    const card = container.querySelector("[data-slot='category-card']");
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass("rounded-xl");

    // The PolyCard link surface carries the visual styles
    const link = screen.getByRole("link", { name: "Shop TRUCKS" });
    expect(link).toHaveClass("bg-surface-primary");
    expect(link).toHaveClass("px-4");
    expect(link).toHaveClass("py-6");
  });

  it("uses aspect-ratio sizing instead of fixed pixel dimensions", () => {
    render(<CategoryCard data={categoryCardFixture} />);

    const link = screen.getByRole("link", { name: "Shop TRUCKS" });
    expect(link).toHaveClass("aspect-[268/357]");
    expect(link).toHaveClass("lg:aspect-[334/445]");
    expect(link).toHaveClass("w-full");
    // Verify no fixed pixel widths/heights are present
    expect(link.className).not.toMatch(FIXED_WIDTH_RE);
    expect(link.className).not.toMatch(FIXED_HEIGHT_RE);
  });

  it("image container uses flex-1 for proportional scaling", () => {
    render(<CategoryCard data={categoryCardFixture} />);

    const link = screen.getByRole("link", { name: "Shop TRUCKS" });
    const cardContent = link.querySelector("[data-slot='card-content']");
    expect(cardContent).toHaveClass("flex-1");
    // Verify no fixed pixel height on image container
    expect(cardContent?.className).not.toMatch(FIXED_HEIGHT_RE);
  });

  it("renders all 4 categories correctly", () => {
    render(
      <div>
        {categoryCardsListFixture.map((card) => (
          <CategoryCard data={card} key={card.name} />
        ))}
      </div>
    );

    expect(screen.getByRole("heading", { level: 3, name: "CARS & MINIVANS" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "TRUCKS" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "CROSSOVERS & SUVs" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "ELECTRIC" })).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
  });

  it("the data-slot='category-card' attribute is retained on the outermost element", () => {
    const { container } = render(<CategoryCard data={categoryCardFixture} />);

    const card = container.querySelector("[data-slot='category-card']");
    expect(card).toBeInTheDocument();
    // The card wrapper is the first meaningful element rendered by the component
    expect(card?.tagName).toBe("DIV");
    // No parent with data-slot between the card and the container
    expect(card?.parentElement?.closest("[data-slot]")).toBeNull();
  });

  it("is a Server Component — no 'use client' directive", () => {
    const { container } = render(<CategoryCard data={categoryCardFixture} />);
    expect(container.querySelector("[data-slot='category-card']")).toBeInTheDocument();
  });
});
