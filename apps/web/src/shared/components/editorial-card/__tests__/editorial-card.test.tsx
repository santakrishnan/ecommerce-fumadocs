import { LinkEditorialCard } from "@shared/components/editorial-card";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import {
  defaultEditorialCard,
  editorialCardWithIcon,
  largeEditorialCard,
} from "../__fixtures__/editorial-card.fixture";

/** Matches fixed pixel-width classes like `w-[268px]` or `w-[360px]`. */
const FIXED_WIDTH_RE = /w-\[\d+px\]/;

describe("EditorialCard", () => {
  it("renders with the correct aria-label combining eyebrow and headline", () => {
    render(<LinkEditorialCard {...defaultEditorialCard} />);

    const link = screen.getByRole("link", {
      name: `${defaultEditorialCard.eyebrow}: ${defaultEditorialCard.headline}`,
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", defaultEditorialCard.href);
  });

  it("renders the headline as an h3 element", () => {
    render(<LinkEditorialCard {...defaultEditorialCard} />);

    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(defaultEditorialCard.headline);
  });

  it("renders the eyebrow text", () => {
    render(<LinkEditorialCard {...defaultEditorialCard} />);

    expect(screen.getByText(defaultEditorialCard.eyebrow)).toBeInTheDocument();
  });

  it("renders next/image with object-cover", () => {
    const { container } = render(<LinkEditorialCard {...defaultEditorialCard} />);

    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src");
    expect(img).toHaveAttribute("alt", "");
    expect(img?.className).toContain("object-cover");
  });

  it("uses Card component as the outer wrapper with data-slot", () => {
    const { container } = render(<LinkEditorialCard {...defaultEditorialCard} />);

    const card = container.querySelector('[data-slot="card"]');
    expect(card).toBeInTheDocument();
    expect(card?.className).toContain("relative");
  });

  it("does not render a gradient overlay", () => {
    const { container } = render(<LinkEditorialCard {...defaultEditorialCard} />);

    const overlay = container.querySelector(".bg-linear-to-t");
    expect(overlay).not.toBeInTheDocument();
  });

  it("defaults to data-surface='dark' when surface is not specified", () => {
    const { container } = render(<LinkEditorialCard {...defaultEditorialCard} />);

    const wrapper = container.querySelector('[data-slot="card-root"]');
    expect(wrapper).toHaveAttribute("data-surface", "dark");
  });

  it("applies data-surface='light' when surface='light'", () => {
    const { container } = render(<LinkEditorialCard {...defaultEditorialCard} surface="light" />);

    const wrapper = container.querySelector('[data-slot="card-root"]');
    expect(wrapper).toHaveAttribute("data-surface", "light");
  });

  it("applies medium size classes by default", () => {
    const { container } = render(<LinkEditorialCard {...defaultEditorialCard} />);

    const card = container.querySelector('[data-slot="card"]');
    expect(card?.className).toContain("aspect-[268/357]");
    expect(card?.className).not.toMatch(FIXED_WIDTH_RE);
  });

  it("applies large size classes when size=large", () => {
    const { container } = render(<LinkEditorialCard {...largeEditorialCard} />);

    const card = container.querySelector('[data-slot="card"]');
    expect(card?.className).toContain("aspect-[360/480]");
    expect(card?.className).not.toMatch(FIXED_WIDTH_RE);
  });

  it("does not render the button when matches is omitted", () => {
    render(<LinkEditorialCard {...defaultEditorialCard} matches={undefined} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders the icon before the eyebrow text when icon is provided", () => {
    const { container } = render(<LinkEditorialCard {...editorialCardWithIcon} />);

    const iconLabel = container.querySelector('[data-slot="eyebrow"]');
    expect(iconLabel).toBeInTheDocument();

    const svg = iconLabel?.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("uses body-sm for eyebrow when icon is provided", () => {
    const { container } = render(<LinkEditorialCard {...editorialCardWithIcon} />);

    const eyebrow = container.querySelector('[data-slot="eyebrow"].body-sm');
    expect(eyebrow).toBeInTheDocument();
    expect(eyebrow).toHaveTextContent(editorialCardWithIcon.eyebrow);
  });

  it("uses body-sm for eyebrow when no icon is provided", () => {
    const { container } = render(<LinkEditorialCard {...defaultEditorialCard} />);

    const eyebrow = container.querySelector('[data-slot="eyebrow"].body-sm');
    expect(eyebrow).toBeInTheDocument();
    expect(eyebrow).toHaveTextContent(defaultEditorialCard.eyebrow);
  });

  it("applies text-text-primary to eyebrow regardless of surface", () => {
    const { container } = render(<LinkEditorialCard {...defaultEditorialCard} />);

    const eyebrowEl = container.querySelector('[data-slot="eyebrow"]');
    expect(eyebrowEl).toHaveClass("text-text-primary");
  });

  it("renders the hover button when matches is provided", () => {
    render(<LinkEditorialCard {...defaultEditorialCard} matches={5} />);

    expect(screen.getByRole("button", { name: "5 Found Matches" })).toBeInTheDocument();
  });
});
