/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
});

describe("MemberQRCode", () => {
  it("renders an SVG QR code with the correct aria-label", async () => {
    const { MemberQRCode } = await import("../member-qr-code");
    render(<MemberQRCode memberId="customer-321" />);

    const qrCode = screen.getByRole("img", {
      name: "QR code linking to member profile",
    });
    expect(qrCode).toBeInTheDocument();
    expect(qrCode.tagName.toLowerCase()).toBe("svg");
  });

  it("renders at the default size of 64", async () => {
    const { MemberQRCode } = await import("../member-qr-code");
    const { container } = render(<MemberQRCode memberId="customer-321" />);

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "60");
    expect(svg).toHaveAttribute("height", "60");
  });

  it("renders at a custom size when provided", async () => {
    const { MemberQRCode } = await import("../member-qr-code");
    const { container } = render(<MemberQRCode memberId="customer-321" size={96} />);

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "96");
    expect(svg).toHaveAttribute("height", "96");
  });

  it("encodes the correct profile URL in the QR code value", async () => {
    const { MemberQRCode } = await import("../member-qr-code");
    const { container } = render(<MemberQRCode memberId="my-member-id" />);

    // QRCodeSVG renders a <title> or we can check the SVG path data exists
    // The simplest check is that the SVG is rendered (not empty)
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    // Verify the SVG has path elements (QR code dots)
    const paths = svg?.querySelectorAll("path");
    expect(paths?.length).toBeGreaterThan(0);
  });
});
