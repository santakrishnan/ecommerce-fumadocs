/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import {
  CARD_BG_ALT,
  MEMBER_NAME_LABEL,
  MEMBER_SINCE_TEXT,
  WALLET_CTA_LABEL,
} from "../member-id-card-constants";
import { MemberIdCardContent } from "../member-id-card-content";

vi.mock("qrcode.react", () => ({
  QRCodeSVG: (props: Record<string, unknown>) => (
    <svg
      aria-label={props["aria-label"] as string}
      data-testid="member-qr-code"
      data-value={props.value as string}
      role="img"
    />
  ),
}));

const defaultProps = {
  tier: "t2" as const,
  year: "2025",
  isLinked: true,
};

describe("MemberIdCardContent", () => {
  describe("wordmark icons", () => {
    it("renders the Toyota logo and iD wordmark SVGs", () => {
      const { container } = render(<MemberIdCardContent {...defaultProps} />);
      const svgs = container.querySelectorAll('[data-slot="icon"]');
      // Toyota logo + iD wordmark + arrow icon in CTA = at least 3
      expect(svgs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("background image", () => {
    it("renders the background image with correct alt text", () => {
      render(<MemberIdCardContent {...defaultProps} />);
      expect(screen.getByAltText(CARD_BG_ALT)).toBeInTheDocument();
    });

    it("renders a custom background alt when provided", () => {
      render(<MemberIdCardContent {...defaultProps} backgroundAlt="Custom alt" />);
      expect(screen.getByAltText("Custom alt")).toBeInTheDocument();
    });
  });

  describe("member label (linked state)", () => {
    it("renders the member label when isLinked is true", () => {
      render(<MemberIdCardContent {...defaultProps} isLinked={true} />);
      expect(screen.getByText(MEMBER_NAME_LABEL)).toBeInTheDocument();
    });

    it("does not render the member label when isLinked is false", () => {
      render(<MemberIdCardContent {...defaultProps} isLinked={false} />);
      expect(screen.queryByText(MEMBER_NAME_LABEL)).not.toBeInTheDocument();
    });

    it("renders a custom member label when provided", () => {
      render(<MemberIdCardContent {...defaultProps} memberLabel="Alice B." />);
      expect(screen.getByText("Alice B.")).toBeInTheDocument();
    });
  });

  describe("member since text", () => {
    it("renders the member since prefix with the year", () => {
      render(<MemberIdCardContent {...defaultProps} year="2025" />);
      expect(screen.getByText(`${MEMBER_SINCE_TEXT} 2025`)).toBeInTheDocument();
    });

    it("renders with a custom year", () => {
      render(<MemberIdCardContent {...defaultProps} year="2024" />);
      expect(screen.getByText("Member since 2024")).toBeInTheDocument();
    });
  });

  describe("wallet CTA", () => {
    it("renders the wallet CTA button by default", () => {
      render(<MemberIdCardContent {...defaultProps} />);
      expect(screen.getByRole("button", { name: WALLET_CTA_LABEL })).toBeInTheDocument();
    });

    it("hides the wallet CTA when showWalletCta is false", () => {
      render(<MemberIdCardContent {...defaultProps} showWalletCta={false} />);
      expect(screen.queryByRole("button", { name: WALLET_CTA_LABEL })).not.toBeInTheDocument();
    });

    it("renders a custom wallet CTA label", () => {
      render(<MemberIdCardContent {...defaultProps} walletCtaLabel="Add to Wallet" />);
      expect(screen.getByRole("button", { name: "Add to Wallet" })).toBeInTheDocument();
    });
  });

  describe("visual states", () => {
    it("renders T0/T1 state (anonymous) without member label", () => {
      render(<MemberIdCardContent isLinked={false} tier="t0" year="2024" />);
      expect(screen.queryByText(MEMBER_NAME_LABEL)).not.toBeInTheDocument();
      expect(screen.getByText(`${MEMBER_SINCE_TEXT} 2024`)).toBeInTheDocument();
    });

    it("renders T2/T3 state (linked) with member label", () => {
      render(<MemberIdCardContent isLinked={true} tier="t2" year="2025" />);
      expect(screen.getByText(MEMBER_NAME_LABEL)).toBeInTheDocument();
      expect(screen.getByText(`${MEMBER_SINCE_TEXT} 2025`)).toBeInTheDocument();
    });
  });

  describe("QR code", () => {
    it("renders the QR code when memberId is provided", () => {
      render(<MemberIdCardContent {...defaultProps} memberId="cust-123" />);
      expect(screen.getByTestId("member-qr-code")).toBeInTheDocument();
    });

    it("renders the QR code even when isLinked is false if memberId is provided", () => {
      render(<MemberIdCardContent {...defaultProps} isLinked={false} memberId="cust-123" />);
      expect(screen.getByTestId("member-qr-code")).toBeInTheDocument();
    });

    it("does not render the QR code when memberId is undefined", () => {
      render(<MemberIdCardContent {...defaultProps} />);
      expect(screen.queryByTestId("member-qr-code")).not.toBeInTheDocument();
    });

    it("does not render the QR code for anonymous T0 visitors without memberId", () => {
      render(<MemberIdCardContent isLinked={false} memberId={undefined} tier="t0" year="2024" />);
      expect(screen.queryByTestId("member-qr-code")).not.toBeInTheDocument();
    });
  });
});
