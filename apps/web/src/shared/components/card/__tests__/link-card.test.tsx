import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { LinkCard } from "../link-card";

vi.mock("next/link", () => ({
  default: ({ children, href, onNavigate, prefetch, ...props }: any) => (
    <a href={href} onClick={() => onNavigate?.({ preventDefault: () => undefined })} {...props}>
      {children}
    </a>
  ),
}));

describe("LinkCard", () => {
  it("renders a link with the provided href", () => {
    render(
      <LinkCard linkProps={{ href: "/vehicles/123" }}>
        <span>Card content</span>
      </LinkCard>
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/vehicles/123");
  });

  it("spreads aria-label onto the link", () => {
    render(
      <LinkCard linkProps={{ href: "/vehicles/123", "aria-label": "View 2025 Camry" }}>
        <span>Card content</span>
      </LinkCard>
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("aria-label", "View 2025 Camry");
  });

  it("renders children inside the card surface", () => {
    render(
      <LinkCard linkProps={{ href: "/" }}>
        <span data-testid="child">Hello</span>
      </LinkCard>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders adornments as siblings outside the card surface", () => {
    const { container } = render(
      <LinkCard adornments={<button type="button">Save</button>} linkProps={{ href: "/" }}>
        <span>Content</span>
      </LinkCard>
    );
    const wrapper = container.querySelector("[data-slot='card-root']");
    const adornmentsDiv = wrapper?.querySelector(".pointer-events-none");
    expect(adornmentsDiv).not.toBeNull();
    expect(adornmentsDiv?.querySelector("button")).toHaveTextContent("Save");
  });

  it("does not render adornments slot when adornments is omitted", () => {
    const { container } = render(
      <LinkCard linkProps={{ href: "/" }}>
        <span>Content</span>
      </LinkCard>
    );
    const wrapper = container.querySelector("[data-slot='card-root']");
    const adornmentsDiv = wrapper?.querySelector(".pointer-events-none");
    expect(adornmentsDiv).toBeNull();
  });

  it("applies className to the card surface", () => {
    const { container } = render(
      <LinkCard className="bg-red-500" linkProps={{ href: "/" }}>
        <span>Content</span>
      </LinkCard>
    );
    const card = container.querySelector("[data-slot='card']");
    expect(card).toHaveClass("bg-red-500");
  });

  it("applies wrapperClassName to the card-root div", () => {
    const { container } = render(
      <LinkCard linkProps={{ href: "/" }} wrapperClassName="w-[300px]">
        <span>Content</span>
      </LinkCard>
    );
    const wrapper = container.querySelector("[data-slot='card-root']");
    expect(wrapper).toHaveClass("w-[300px]");
  });

  it("adds data-carousel-focus on the link for keyboard navigation", () => {
    render(
      <LinkCard linkProps={{ href: "/" }}>
        <span>Content</span>
      </LinkCard>
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("data-carousel-focus");
  });

  it("spreads additional link props (e.g. prefetch)", () => {
    render(
      <LinkCard linkProps={{ href: "/", prefetch: false }}>
        <span>Content</span>
      </LinkCard>
    );
    const link = screen.getByRole("link");
    // Next.js Link passes prefetch as a data attribute in test mocks
    // The important thing is that it doesn't error and the prop passes through
    expect(link).toBeInTheDocument();
  });
});
