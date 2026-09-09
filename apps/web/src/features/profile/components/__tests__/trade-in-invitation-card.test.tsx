/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { TradeInInvitationCard } from "../trade-in-invitation-card";

// Mock next/image
vi.mock("next/image", () => ({
  // biome-ignore lint/performance/noImgElement: test mock for next/image
  // biome-ignore lint/correctness/useImageSize: test mock for next/image
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

describe("TradeInInvitationCard", () => {
  it("renders the headline text (mobile and desktop)", () => {
    render(<TradeInInvitationCard />);
    const elements = screen.getAllByText("Track your trade-in value");
    expect(elements).toHaveLength(2);
  });

  it("renders the subtext", () => {
    render(<TradeInInvitationCard />);
    const elements = screen.getAllByText(
      "Get an estimate in minutes and track the value over time so you're ready to buy."
    );
    expect(elements.length).toBeGreaterThan(0);
  });

  it("renders the license plate or VIN input", () => {
    render(<TradeInInvitationCard />);
    expect(screen.getByLabelText("License plate or VIN")).toBeInTheDocument();
  });

  it("renders the state dropdown", () => {
    const { container } = render(<TradeInInvitationCard />);
    const selectTrigger = container.querySelector("[data-slot='select-trigger']");
    expect(selectTrigger).toBeInTheDocument();
  });

  it("renders the Continue button", () => {
    render(<TradeInInvitationCard />);
    expect(screen.getByText("Continue")).toBeInTheDocument();
  });

  it("renders carousel images from fixture data", () => {
    const { container } = render(<TradeInInvitationCard />);
    const images = container.querySelectorAll("img");
    expect(images.length).toBeGreaterThan(0);
  });
});

describe("TradeInInvitationCard — Continue button disabled state", () => {
  it("disables Continue when the license plate field is empty", () => {
    render(<TradeInInvitationCard />);
    const button = screen.getByText("Continue");
    expect(button).toBeDisabled();
  });

  it("enables Continue when the license plate field has a value", async () => {
    const { userEvent } = await import("@testing-library/user-event");
    render(<TradeInInvitationCard />);
    const input = screen.getByLabelText("License plate or VIN");
    await userEvent.setup().type(input, "XYZ5678");
    const button = screen.getByText("Continue");
    expect(button).not.toBeDisabled();
  });
});
