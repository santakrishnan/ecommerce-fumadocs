import userEvent from "@testing-library/user-event";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { PurchaseCard } from "../purchase-card";
import type { PurchaseCardUpperProps } from "../purchase-card-upper";
import { PurchaseCardUpper } from "../purchase-card-upper";

const BASE_PROPS: Omit<PurchaseCardUpperProps, "paymentState"> = {
  dealer: {
    address: "6401 6th Ave, Brooklyn, NY 11220",
    dealerCode: "5012",
    mapThumbnailUrl: "/images/vdp/purchase-card-map.png",
    name: "Toyota of Bay Ridge",
  },
  vehicle: {
    certification: false,
    make: "Toyota",
    mileage: 36_435,
    model: "Highlander Hybrid",
    msrp: 31_775,
    price: 30_775,
    trim: "Limited",
    vin: "5TDYZ3DC3PS058712",
    year: 2023,
  },
};

const PURCHASE_CARD_DEFAULT: PurchaseCardUpperProps = {
  ...BASE_PROPS,
  paymentState: { kind: "default" },
};

const PURCHASE_CARD_ESTIMATED: PurchaseCardUpperProps = {
  ...BASE_PROPS,
  paymentState: {
    downPayment: 3500,
    kind: "estimated",
    monthlyPayment: 456.97,
  },
};

const PURCHASE_CARD_ACTIVE: PurchaseCardUpperProps = {
  ...BASE_PROPS,
  paymentState: {
    apr: 3.29,
    expiresIn: "Expires in 5d, 18h",
    kind: "active",
    monthlyPayment: 297,
    termMonths: 60,
  },
};

const PURCHASE_CARD_EXPIRED: PurchaseCardUpperProps = {
  ...BASE_PROPS,
  paymentState: { kind: "expired" },
};

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, width, height, ...props }: React.ComponentProps<"img">) => (
    // biome-ignore lint/performance/noImgElement: test mock requires native img
    <img alt={alt} height={height} src={src} width={width} {...props} />
  ),
}));

vi.mock("@features/profile/watchlist", () => ({
  useBookmarkedVehicle: () => ({
    isBookmarked: false,
    isLoading: false,
    toggle: vi.fn(),
  }),
}));

// ─── Regex constants (Biome useTopLevelRegex) ────────────────────────
const SAVE_VEHICLE_PATTERN = /save vehicle/i;
const YEAR_MILEAGE_PATTERN = /2023 · 36,435 mi/;
const VEHICLE_TITLE_PATTERN = /TOYOTA HIGHLANDER HYBRID LIMITED/i;
const ESTIMATED_PAYMENT_PATTERN = /estimated payment/i;
const PER_MO_PATTERN = /\/mo/;
const WITH_DOWN_PATTERN = /with.*down/i;
const PAYMENT_DETAILS_PATTERN = /payment estimate details/i;
const GET_PRE_APPROVED_PATTERN = /get pre-approved/i;
const EXPIRES_PATTERN = /expires in 5d, 18h/i;
const APR_PATTERN = /3\.29% APR for 60 months/i;
const CONTINUE_PURCHASE_PATTERN = /continue purchase/i;
const OFFER_EXPIRED_PATTERN = /your previous offer has expired/i;
const RESTART_PURCHASE_PATTERN = /restart purchase/i;
const YOUR_OFFER_PATTERN = /your offer/i;
const EXPIRED_PATTERN = /expired/i;
const REMOVE_SAVED_PATTERN = /remove from saved/i;
const ORIGINAL_PRICE_PATTERN = /original price/i;
const AVAILABLE_DEALER_PATTERN = /available at toyota of bay ridge/i;
const MAP_ALT_PATTERN = /map showing toyota of bay ridge/i;

describe("PurchaseCard", () => {
  describe("Header (AC6)", () => {
    it("renders the badge with label", () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_DEFAULT} />);
      expect(screen.getByText("Below market")).toBeInTheDocument();
    });

    it("renders badge without icon when certification is gold", () => {
      render(
        <PurchaseCardUpper
          {...PURCHASE_CARD_DEFAULT}
          vehicle={{ ...BASE_PROPS.vehicle, certification: "gold" }}
        />
      );
      const badge = screen.getByText("Gold Certified").closest("[data-surface='light']");
      expect(badge).not.toBeNull();
      expect(badge?.querySelector("[data-icon='inline-start']")).toBeNull();
    });

    it("renders Silver Certified badge when certification is silver", () => {
      render(
        <PurchaseCardUpper
          {...PURCHASE_CARD_DEFAULT}
          vehicle={{ ...BASE_PROPS.vehicle, certification: "silver" }}
        />
      );
      expect(screen.getByText("Silver Certified")).toBeInTheDocument();
    });

    it("does not render MSRP strikethrough when msrp equals price", () => {
      render(
        <PurchaseCardUpper
          {...PURCHASE_CARD_DEFAULT}
          vehicle={{ ...BASE_PROPS.vehicle, msrp: 30_775 }}
        />
      );
      expect(screen.queryByText(ORIGINAL_PRICE_PATTERN)).not.toBeInTheDocument();
    });

    it("does not render map thumbnail when mapThumbnailUrl is omitted", () => {
      render(
        <PurchaseCardUpper
          {...PURCHASE_CARD_DEFAULT}
          dealer={{ ...BASE_PROPS.dealer, mapThumbnailUrl: undefined }}
        />
      );
      expect(screen.queryByAltText(MAP_ALT_PATTERN)).not.toBeInTheDocument();
    });

    it("renders the save toggle button", () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_DEFAULT} />);
      expect(screen.getByRole("button", { name: SAVE_VEHICLE_PATTERN })).toBeInTheDocument();
    });

    it("renders sale price", () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_DEFAULT} />);
      expect(screen.getByText("$30,775")).toBeInTheDocument();
    });

    it("uses responsive typography tokens for the badge and sale price", () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_DEFAULT} />);
      const badge = screen.getByText("Below market").closest("[data-surface='light']");

      expect(badge).toHaveClass("disclaimer");
      expect(badge).not.toHaveClass("xl:text-xs");
      expect(screen.getByText("$30,775")).toHaveClass("body-lg");
    });

    it("renders vehicle title as h2 with vehicle-title-lg", () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_DEFAULT} />);
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("TOYOTA HIGHLANDER HYBRID LIMITED");
      expect(heading).toHaveClass("vehicle-title-lg");
    });

    it("renders year and mileage", () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_DEFAULT} />);
      expect(screen.getByText(YEAR_MILEAGE_PATTERN)).toBeInTheDocument();
    });

    it("header renders identically across all states", () => {
      const fixtures = [
        PURCHASE_CARD_DEFAULT,
        PURCHASE_CARD_ESTIMATED,
        PURCHASE_CARD_ACTIVE,
        PURCHASE_CARD_EXPIRED,
      ];

      for (const fixture of fixtures) {
        const { unmount } = render(<PurchaseCardUpper {...fixture} />);
        expect(screen.getByText("Below market")).toBeInTheDocument();
        expect(screen.getByText("$30,775")).toBeInTheDocument();
        expect(
          screen.getByRole("heading", { level: 2, name: VEHICLE_TITLE_PATTERN })
        ).toBeInTheDocument();
        unmount();
      }
    });
  });

  describe("S1 Default (AC1)", () => {
    it("renders no payment block", () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_DEFAULT} />);
      expect(screen.queryByText(ESTIMATED_PAYMENT_PATTERN)).not.toBeInTheDocument();
      expect(screen.queryByText(YOUR_OFFER_PATTERN)).not.toBeInTheDocument();
      expect(screen.queryByText(EXPIRED_PATTERN)).not.toBeInTheDocument();
    });

    it('CTA reads "Get pre-approved"', () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_DEFAULT} />);
      expect(screen.getByRole("button", { name: GET_PRE_APPROVED_PATTERN })).toBeInTheDocument();
    });
  });

  describe("S2 Estimated (AC2)", () => {
    it("renders estimated payment and down payment", () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_ESTIMATED} />);
      expect(screen.getByText(ESTIMATED_PAYMENT_PATTERN)).toBeInTheDocument();
      expect(screen.getByText(PER_MO_PATTERN)).toBeInTheDocument();
      expect(screen.getByText(WITH_DOWN_PATTERN)).toBeInTheDocument();
    });

    it("renders the info button", () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_ESTIMATED} />);
      expect(screen.getByRole("button", { name: PAYMENT_DETAILS_PATTERN })).toBeInTheDocument();
    });

    it('CTA reads "Get pre-approved"', () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_ESTIMATED} />);
      expect(screen.getByRole("button", { name: GET_PRE_APPROVED_PATTERN })).toBeInTheDocument();
    });
  });

  describe("S3 Active Offer (AC3)", () => {
    it("renders expiry, monthly payment, and APR/term", () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_ACTIVE} />);
      expect(screen.getByText(EXPIRES_PATTERN)).toBeInTheDocument();
      expect(screen.getByText("$297")).toBeInTheDocument();
      expect(screen.getByText(APR_PATTERN)).toBeInTheDocument();
    });

    it('CTA reads "Continue purchase"', () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_ACTIVE} />);
      expect(screen.getByRole("button", { name: CONTINUE_PURCHASE_PATTERN })).toBeInTheDocument();
    });
  });

  describe("S4 Expired Offer (AC4)", () => {
    it('renders "Your previous offer has expired."', () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_EXPIRED} />);
      expect(screen.getByText(OFFER_EXPIRED_PATTERN)).toBeInTheDocument();
    });

    it('CTA reads "Restart purchase"', () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_EXPIRED} />);
      expect(screen.getByRole("button", { name: RESTART_PURCHASE_PATTERN })).toBeInTheDocument();
    });
  });

  describe("Surface theming (AC5)", () => {
    it("upper component does not own data-surface (shell owns it)", () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_DEFAULT} />);
      const card = screen.getByTestId("purchase-card-upper");
      expect(card).not.toHaveAttribute("data-surface");
    });

    it("CTA wrapper does not carry a data-surface override", () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_DEFAULT} />);
      expect(screen.getByTestId("purchase-cta-wrapper")).not.toHaveAttribute("data-surface");
    });
  });

  describe("Accessibility (AC8)", () => {
    it("CTA is an anchor element with state-accurate accessible name", () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_ACTIVE} />);
      const cta = screen.getByRole("button", { name: CONTINUE_PURCHASE_PATTERN });
      expect(cta.tagName).toBe("BUTTON");
      expect(cta).toHaveAttribute(
        "aria-label",
        "Continue purchase for TOYOTA HIGHLANDER HYBRID LIMITED"
      );
    });

    it("save toggle exposes pressed state", () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_DEFAULT} isSaved />);
      const toggle = screen.getByRole("button", { name: REMOVE_SAVED_PATTERN });
      expect(toggle).toHaveAttribute("aria-pressed", "true");
    });

    it("save toggle calls onSaveToggle when clicked", async () => {
      const onSaveToggle = vi.fn();
      render(
        <PurchaseCardUpper {...PURCHASE_CARD_DEFAULT} isSaved={false} onSaveToggle={onSaveToggle} />
      );
      const toggle = screen.getByRole("button", { name: SAVE_VEHICLE_PATTERN });
      await userEvent.click(toggle);
      expect(onSaveToggle).toHaveBeenCalledOnce();
    });

    it("info button is keyboard-reachable", () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_ESTIMATED} />);
      const infoBtn = screen.getByRole("button", { name: PAYMENT_DETAILS_PATTERN });
      expect(infoBtn).toBeInTheDocument();
      expect(infoBtn.tagName).toBe("BUTTON");
    });
  });

  describe("Availability block", () => {
    it("renders dealer name and address", () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_DEFAULT} />);
      expect(screen.getByText(AVAILABLE_DEALER_PATTERN)).toBeInTheDocument();
      expect(screen.getByText("6401 6th Ave, Brooklyn, NY 11220")).toBeInTheDocument();
    });

    it("renders map thumbnail when provided", () => {
      render(<PurchaseCardUpper {...PURCHASE_CARD_DEFAULT} />);
      const img = screen.getByAltText(MAP_ALT_PATTERN);
      expect(img).toBeInTheDocument();
    });
  });
});

describe("PurchaseCard shell", () => {
  it("renders mobile and desktop variants with data-testid purchase-card", () => {
    render(<PurchaseCard {...PURCHASE_CARD_DEFAULT} />);
    const cards = screen.getAllByTestId("purchase-card");
    expect(cards).toHaveLength(2);
  });

  it("applies the XL width override to the desktop variant", () => {
    render(<PurchaseCard {...PURCHASE_CARD_DEFAULT} />);
    const desktopCard = screen.getAllByTestId("purchase-card")[1];
    expect(desktopCard).toHaveClass("max-w-md", "xl:max-w-none");
  });

  it("mobile variant sets data-surface=dark, desktop sets data-surface=dark by default", () => {
    render(<PurchaseCard {...PURCHASE_CARD_DEFAULT} />);
    const cards = screen.getAllByTestId("purchase-card");
    // Both hardcoded to dark
    expect(cards[0]).toHaveAttribute("data-surface", "dark");
    expect(cards[1]).toHaveAttribute("data-surface", "dark");
  });

  it("renders bookingStrip slot when provided", () => {
    render(<PurchaseCard {...PURCHASE_CARD_DEFAULT} bookingStrip={<div>Book Now</div>} />);
    expect(screen.getAllByText("Book Now")).toHaveLength(2);
  });

  it("does not render bookingStrip when omitted", () => {
    render(<PurchaseCard {...PURCHASE_CARD_DEFAULT} />);
    expect(screen.queryByText("Book Now")).not.toBeInTheDocument();
  });

  it("PurchaseCardUpper does not own data-surface attribute", () => {
    render(<PurchaseCard {...PURCHASE_CARD_DEFAULT} />);
    const uppers = screen.getAllByTestId("purchase-card-upper");
    for (const upper of uppers) {
      expect(upper).not.toHaveAttribute("data-surface");
    }
  });
});
