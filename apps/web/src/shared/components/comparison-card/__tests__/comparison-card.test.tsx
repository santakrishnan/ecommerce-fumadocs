/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { LinkComparisonCard, type LinkComparisonCardProps } from "../link-comparison-card";

// ─── Mocks ──────────────────────────────────────────────────────────
vi.mock("next/image", () => ({
  // biome-ignore lint/performance/noImgElement: Test mock requires native img element
  // biome-ignore lint/correctness/useImageSize: Test mock doesn't need explicit dimensions
  // biome-ignore lint/a11y/useAltText: Props are spread from the component under test
  default: (props: React.ComponentProps<"img">) => <img {...props} />,
}));

// ─── Fixtures ───────────────────────────────────────────────────────
const BASE_PROPS: LinkComparisonCardProps = {
  attributeLayout: "list",
  image: { src: "/vehicles/rav4.png", alt: "2024 RAV4 HYBRID" },
  linkProps: { href: "/vehicles/rav4" },
  title: "RAV4 HYBRID",
  year: 2024,
  description: "A versatile compact SUV with hybrid efficiency.",
  metrics: [{ label: "Max cargo", value: "84.3", unit: "CU. FT." }],
};

// ─── Regex patterns ─────────────────────────────────────────────────
const RAV4_HYBRID = /RAV4 HYBRID/i;
const DESCRIPTION_TEXT = /versatile compact SUV/i;

// ─── Rendering ──────────────────────────────────────────────────────

describe("ComparisonCard", () => {
  it("renders the vehicle title", () => {
    render(<LinkComparisonCard {...BASE_PROPS} />);
    expect(screen.getByRole("heading", { level: 3, name: RAV4_HYBRID })).toBeInTheDocument();
  });

  it("renders the year", () => {
    render(<LinkComparisonCard {...BASE_PROPS} />);
    expect(screen.getByText("2024")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<LinkComparisonCard {...BASE_PROPS} />);
    expect(screen.getByText(DESCRIPTION_TEXT)).toBeInTheDocument();
  });

  it("renders the vehicle image with correct alt text", () => {
    render(<LinkComparisonCard {...BASE_PROPS} />);
    const img = screen.getByAltText("2024 RAV4 HYBRID");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/vehicles/rav4.png");
  });

  it("renders without year when not provided", () => {
    render(<LinkComparisonCard {...BASE_PROPS} year={undefined} />);
    expect(screen.queryByText("2024")).not.toBeInTheDocument();
  });

  it("renders without description when not provided", () => {
    render(<LinkComparisonCard {...BASE_PROPS} description={undefined} />);
    expect(screen.queryByText(DESCRIPTION_TEXT)).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<LinkComparisonCard {...BASE_PROPS} className="custom-class" />);
    const card = container.querySelector("[data-slot='card']");
    expect(card).toHaveClass("custom-class");
  });

  it("has a white border", () => {
    const { container } = render(<LinkComparisonCard {...BASE_PROPS} />);
    const card = container.querySelector("[data-slot='card']");
    expect(card?.className).toContain("border-white");
  });

  it("sets data-surface='dark' on the card root for surface-aware tokens", () => {
    const { container } = render(<LinkComparisonCard {...BASE_PROPS} />);
    const wrapper = container.querySelector("[data-slot='card-root']");
    expect(wrapper).toHaveAttribute("data-surface", "dark");
  });
});

// ─── Badge ──────────────────────────────────────────────────────────

describe("ComparisonCard — badge", () => {
  it("renders badge with label text", () => {
    render(<LinkComparisonCard {...BASE_PROPS} badgeLabel="Most space" />);
    expect(screen.getByText("Most space")).toBeInTheDocument();
  });

  it("renders default spark icon when no custom badgeIcon is provided", () => {
    const { container } = render(<LinkComparisonCard {...BASE_PROPS} badgeLabel="Best range" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("renders custom badgeIcon when provided", () => {
    const customIcon = <span data-testid="custom-icon">★</span>;
    render(<LinkComparisonCard {...BASE_PROPS} badgeIcon={customIcon} badgeLabel="Custom" />);
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("does not render badge when badgeLabel is not provided", () => {
    render(<LinkComparisonCard {...BASE_PROPS} />);
    expect(screen.queryByText("Most space")).not.toBeInTheDocument();
  });

  it("sets data-surface='light' on the badge for correct text contrast", () => {
    const { container } = render(<LinkComparisonCard {...BASE_PROPS} badgeLabel="Most space" />);
    const badge = container.querySelector("[data-surface='light']");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Most space");
  });

  it("does not render badge when showBadge is false even if badgeLabel is provided", () => {
    render(<LinkComparisonCard {...BASE_PROPS} badgeLabel="Most space" showBadge={false} />);
    expect(screen.queryByText("Most space")).not.toBeInTheDocument();
  });

  it("renders badge with badgeIconName resolved from icon map", () => {
    const { container } = render(
      <LinkComparisonCard {...BASE_PROPS} badgeIconName="price-tag" badgeLabel="Best deal" />
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(screen.getByText("Best deal")).toBeInTheDocument();
  });

  it("prefers badgeIcon over badgeIconName when both provided", () => {
    const customIcon = <span data-testid="custom-icon">★</span>;
    render(
      <LinkComparisonCard
        {...BASE_PROPS}
        badgeIcon={customIcon}
        badgeIconName="price-tag"
        badgeLabel="Custom"
      />
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });
});

// ─── Stacked attribute rows (one row per metric) ────────────────────

function separators(container: HTMLElement) {
  return container.querySelectorAll("[data-slot='separator']");
}

describe("ComparisonCard — metric rows", () => {
  it("renders the metric label", () => {
    render(<LinkComparisonCard {...BASE_PROPS} />);
    expect(screen.getByText("Max cargo")).toBeInTheDocument();
  });

  it("renders the metric value with its unit folded in", () => {
    render(<LinkComparisonCard {...BASE_PROPS} />);
    expect(screen.getByText("84.3 CU. FT.")).toBeInTheDocument();
  });

  it("renders a single metric as one row with no dividers (no alternate layout)", () => {
    const { container } = render(<LinkComparisonCard {...BASE_PROPS} />);
    expect(screen.getByText("Max cargo")).toBeInTheDocument();
    expect(separators(container)).toHaveLength(0);
  });
});

describe("ComparisonCard — multiple metrics", () => {
  const multiMetricProps: LinkComparisonCardProps = {
    ...BASE_PROPS,
    metrics: [
      { label: "Range", value: "615", unit: "MI" },
      { label: "Highway MPG", value: "35" },
    ],
  };

  it("renders one divider between each metric", () => {
    const { container } = render(<LinkComparisonCard {...multiMetricProps} />);
    expect(separators(container)).toHaveLength(1);
  });

  it("renders both metric labels", () => {
    render(<LinkComparisonCard {...multiMetricProps} />);
    expect(screen.getByText("Range")).toBeInTheDocument();
    expect(screen.getByText("Highway MPG")).toBeInTheDocument();
  });

  it("renders the value without a unit when none is provided", () => {
    render(<LinkComparisonCard {...multiMetricProps} />);
    expect(screen.getByText("615 MI")).toBeInTheDocument();
    expect(screen.getByText("35")).toBeInTheDocument();
  });

  it("renders every metric with no hardcoded cap", () => {
    const manyMetrics = Array.from({ length: 10 }, (_, index) => ({
      label: `Attribute ${index}`,
      value: String(index),
    }));
    const { container } = render(<LinkComparisonCard {...BASE_PROPS} metrics={manyMetrics} />);
    expect(separators(container)).toHaveLength(9);
    expect(screen.getByText("Attribute 0")).toBeInTheDocument();
    expect(screen.getByText("Attribute 9")).toBeInTheDocument();
  });
});

// ─── Empty metrics ──────────────────────────────────────────────────

describe("ComparisonCard — no metrics", () => {
  it("does not render metric section when metrics array is empty", () => {
    const { container } = render(<LinkComparisonCard {...BASE_PROPS} metrics={[]} />);
    expect(separators(container)).toHaveLength(0);
    expect(screen.queryByText("Max cargo")).not.toBeInTheDocument();
  });
});
