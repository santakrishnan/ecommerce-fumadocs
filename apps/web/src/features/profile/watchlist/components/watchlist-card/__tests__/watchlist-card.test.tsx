/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@ucmp/vitest-config/test-utils";
import { formatMileage, formatPrice } from "utils";
import { describe, expect, it, vi } from "vitest";

import { WatchlistCard, WatchlistCardSkeleton } from "../watchlist-card";
import type { WatchlistCardProps } from "../watchlist-card-types";

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("next/image", () => ({
  default: ({ src, alt }: { alt?: string; src?: string }) =>
    `[Image: ${alt ?? "no-alt"} src=${src ?? "none"}]`,
}));

vi.mock("@ucmp/ui", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    Button: ({ children, ...props }: React.HTMLAttributes<HTMLButtonElement>) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
    Card: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div data-slot="card" {...props}>
        {children}
      </div>
    ),
    Dialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) =>
      open ? <div data-slot="dialog">{children}</div> : null,
    DialogContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div data-slot="dialog-content" {...props}>
        {children}
      </div>
    ),
    DialogDescription: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p {...props}>{children}</p>
    ),
    DialogHeader: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    DialogTitle: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 {...props}>{children}</h2>
    ),
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuItem: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      // biome-ignore lint/a11y/useFocusableInteractive: test mock
      <div role="menuitem" {...props}>
        {children}
      </div>
    ),
    DropdownMenuTrigger: ({ children, ...props }: React.HTMLAttributes<HTMLButtonElement>) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
    Eyebrow: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p data-slot="eyebrow" {...props}>
        {children}
      </p>
    ),
    Field: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    FieldDescription: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p {...props}>{children}</p>
    ),
    FloatingLabel: ({ children, ...props }: React.HTMLAttributes<HTMLLabelElement>) => (
      // biome-ignore lint/a11y/noLabelWithoutControl: test mock
      <label {...props}>{children}</label>
    ),
    FloatingTextarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
      <textarea {...props} />
    ),
    Skeleton: ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div className={className} data-slot="skeleton" {...props} />
    ),
    Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    TooltipTrigger: ({ children, ...props }: React.HTMLAttributes<HTMLButtonElement>) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
  };
});

vi.mock("@shared/components/card", () => ({
  CardBadge: ({
    children,
    className,
    variant,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
  }) => (
    <span className={className} data-slot="card-badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

vi.mock("@ucmp/ui/icons", () => ({
  IconBinocular: (props: Record<string, unknown>) => (
    <svg data-testid="icon-binocular" {...props} />
  ),
  IconCaretRight: (props: Record<string, unknown>) => (
    <svg data-testid="icon-caret-right" {...props} />
  ),
  IconClose: (props: Record<string, unknown>) => <svg data-testid="icon-close" {...props} />,
  IconEdit: (props: Record<string, unknown>) => <svg data-testid="icon-edit" {...props} />,
  IconInfo: (props: Record<string, unknown>) => <svg data-testid="icon-info" {...props} />,
  IconEllipsis: (props: Record<string, unknown>) => <svg data-testid="icon-ellipsis" {...props} />,
  IconToyotaX: (props: Record<string, unknown>) => <svg data-testid="icon-toyota-x" {...props} />,
}));

// ─── Regex patterns (hoisted per lint/performance/useTopLevelRegex) ─────────
const RE_ESTIMATED_PAYMENT = /Estimated payment/;
const RE_WATCHING = /watching/;
const RE_SOLD_SUBTITLE = /Sold on March 24, 2026 at Toyota of Bay Ridge/;
const RE_OFFER_EXPIRY = /Your offer: Expires in 5d, 18h/;

// ─── Fixtures ───────────────────────────────────────────────────────────────

const baseProps: WatchlistCardProps = {
  imageAlt: "2023 Toyota RAV4 XSE",
  imageSrc: "/test-image.jpg",
  make: "Toyota",
  mileage: 36_435,
  model: "RAV4",
  price: 29_245,
  trim: "XSE",
  year: 2023,
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("WatchlistCard", () => {
  describe("Title block", () => {
    it("renders formatted price", () => {
      render(<WatchlistCard {...baseProps} />);
      expect(screen.getByText(formatPrice(baseProps.price))).toBeInTheDocument();
    });

    it("renders title as uppercase make/model/trim", () => {
      render(<WatchlistCard {...baseProps} />);
      expect(screen.getByText("TOYOTA RAV4 XSE")).toBeInTheDocument();
    });

    it("renders year and formatted mileage", () => {
      render(<WatchlistCard {...baseProps} />);
      expect(
        screen.getByText(`${baseProps.year} • ${formatMileage(baseProps.mileage)}`)
      ).toBeInTheDocument();
    });
  });

  describe("Strikethrough originalPrice", () => {
    it("shows strikethrough when originalPrice > price", () => {
      render(<WatchlistCard {...baseProps} originalPrice={30_246} />);
      const strikeEl = screen.getByText(formatPrice(30_246));
      expect(strikeEl).toBeInTheDocument();
      expect(strikeEl).toHaveClass("line-through");
    });

    it("does NOT show strikethrough when originalPrice <= price", () => {
      render(<WatchlistCard {...baseProps} originalPrice={29_000} />);
      expect(screen.queryByText(formatPrice(29_000))).not.toBeInTheDocument();
    });

    it("does NOT show strikethrough when originalPrice is omitted", () => {
      const { container } = render(<WatchlistCard {...baseProps} />);
      const strikeEls = container.querySelectorAll(".line-through");
      expect(strikeEls).toHaveLength(0);
    });
  });

  describe("Payment", () => {
    it("renders estimate payment copy correctly", () => {
      render(
        <WatchlistCard {...baseProps} payment={{ type: "estimate", monthly: 456.97, down: 3500 }} />
      );
      expect(screen.getByText(RE_ESTIMATED_PAYMENT)).toBeInTheDocument();
      expect(screen.getByText(`${formatPrice(456.97)}/mo`)).toBeInTheDocument();
      expect(screen.getAllByText(`with ${formatPrice(3500)} down`).length).toBeGreaterThan(0);
    });
  });

  describe("Badge", () => {
    it("renders badge when provided", () => {
      render(
        <WatchlistCard
          {...baseProps}
          badge={{ label: "$1000 price drop", iconName: "price-tag-filled", variant: "inverse" }}
        />
      );
      expect(screen.getByText("$1000 price drop")).toBeInTheDocument();
    });

    it("omits badge when not provided", () => {
      const { container } = render(<WatchlistCard {...baseProps} />);
      expect(container.querySelector('[data-slot="card-badge"]')).not.toBeInTheDocument();
    });
  });

  describe("Feature tag", () => {
    it("renders feature tag when provided", () => {
      render(<WatchlistCard {...baseProps} featureTag="Adaptive cruise control" />);
      expect(screen.getByText("Adaptive cruise control")).toBeInTheDocument();
    });

    it("omits feature tag when not provided", () => {
      render(<WatchlistCard {...baseProps} />);
      expect(screen.queryByText("Adaptive cruise control")).not.toBeInTheDocument();
    });
  });

  describe("Overflow menu", () => {
    it("renders trigger with accessible name", () => {
      render(<WatchlistCard {...baseProps} overflowItems={[{ key: "remove", label: "Remove" }]} />);
      expect(screen.getByLabelText("More options")).toBeInTheDocument();
    });

    it("does not render overflow when items are empty", () => {
      render(<WatchlistCard {...baseProps} overflowItems={[]} />);
      expect(screen.queryByLabelText("More options")).not.toBeInTheDocument();
    });
  });

  describe("Watching count", () => {
    it("renders watching count with eye icon", () => {
      render(<WatchlistCard {...baseProps} watchingCount={23} />);
      expect(screen.getByText("23 watching")).toBeInTheDocument();
    });

    it("omits watching count when 0", () => {
      render(<WatchlistCard {...baseProps} watchingCount={0} />);
      expect(screen.queryByText(RE_WATCHING)).not.toBeInTheDocument();
    });
  });

  describe("Sold state", () => {
    const soldProps = {
      ...baseProps,
      sold: { date: "March 24, 2026", dealer: "Toyota of Bay Ridge" },
    };

    it("hides price when sold", () => {
      render(<WatchlistCard {...soldProps} />);
      expect(screen.queryByText(formatPrice(baseProps.price))).not.toBeInTheDocument();
    });

    it("renders sold subtitle", () => {
      render(<WatchlistCard {...soldProps} />);
      expect(screen.getByText(RE_SOLD_SUBTITLE)).toBeInTheDocument();
    });

    it("hides payment when sold", () => {
      render(
        <WatchlistCard {...soldProps} payment={{ type: "estimate", monthly: 456.97, down: 3500 }} />
      );
      expect(screen.queryByText(RE_ESTIMATED_PAYMENT)).not.toBeInTheDocument();
    });

    it("hides footer when sold", () => {
      render(<WatchlistCard {...soldProps} featureTag="Adaptive cruise" watchingCount={23} />);
      expect(screen.queryByText(RE_WATCHING)).not.toBeInTheDocument();
      expect(screen.queryByText("Adaptive cruise")).not.toBeInTheDocument();
    });

    it("renders sold overlay", () => {
      const { container } = render(<WatchlistCard {...soldProps} />);
      const overlay = container.querySelector(".bg-white\\/50");
      expect(overlay).toBeInTheDocument();
    });

    it("sets data-state to sold", () => {
      const { container } = render(<WatchlistCard {...soldProps} />);
      const article = container.querySelector('[data-state="sold"]');
      expect(article).toBeInTheDocument();
    });
  });

  describe("Offer payment variant", () => {
    const offerProps = {
      ...baseProps,
      payment: {
        type: "offer" as const,
        monthly: 297,
        apr: 5.99,
        termMonths: 60,
        expiry: "Expires in 5d, 18h",
      },
    };

    it("renders offer expiry text", () => {
      render(<WatchlistCard {...offerProps} />);
      expect(screen.getByText(RE_OFFER_EXPIRY)).toBeInTheDocument();
    });

    it("renders offer monthly price", () => {
      render(<WatchlistCard {...offerProps} />);
      expect(screen.getByText(formatPrice(297))).toBeInTheDocument();
    });

    it("renders APR and term", () => {
      render(<WatchlistCard {...offerProps} />);
      expect(screen.getByText("5.99% APR for 60 months")).toBeInTheDocument();
    });
  });
});

describe("WatchlistCardSkeleton", () => {
  it("renders skeleton container", () => {
    const { container } = render(<WatchlistCardSkeleton />);
    expect(container.querySelector('[data-slot="watchlist-card-skeleton"]')).toBeInTheDocument();
  });

  it("renders multiple skeleton elements (no layout shift)", () => {
    const { container } = render(<WatchlistCardSkeleton />);
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
