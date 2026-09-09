import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { BODY, HERO, HomeExperience } from "../home-experience";
import { LandingBody } from "../landing-body";
import { LandingHero } from "../landing-hero";
import { WelcomeBody } from "../welcome-body";
import { WelcomeHero } from "../welcome-hero";

// Mock all slot components to render identifiable markers
vi.mock("../landing-hero", () => ({
  LandingHero: () => <div data-testid="landing-hero" />,
}));
vi.mock("../welcome-hero", () => ({
  WelcomeHero: () => <div data-testid="welcome-hero" />,
}));
vi.mock("../landing-body", () => ({
  LandingBody: () => <div data-testid="landing-body" />,
}));
vi.mock("../welcome-body", () => ({
  WelcomeBody: () => <div data-testid="welcome-body" />,
}));

describe("HomeExperience", () => {
  describe("mode selection", () => {
    it("renders landing hero + landing body for first-visit", () => {
      render(<HomeExperience mode="first-visit" />);
      expect(screen.getByTestId("landing-hero")).toBeInTheDocument();
      expect(screen.getByTestId("landing-body")).toBeInTheDocument();
      expect(screen.queryByTestId("welcome-hero")).not.toBeInTheDocument();
      expect(screen.queryByTestId("welcome-body")).not.toBeInTheDocument();
    });

    it("renders landing hero + welcome body for recent-return", () => {
      render(<HomeExperience mode="recent-return" />);
      expect(screen.getByTestId("landing-hero")).toBeInTheDocument();
      expect(screen.getByTestId("welcome-body")).toBeInTheDocument();
      expect(screen.queryByTestId("welcome-hero")).not.toBeInTheDocument();
      expect(screen.queryByTestId("landing-body")).not.toBeInTheDocument();
    });

    it("renders welcome hero + welcome body for lapsed-return", () => {
      render(<HomeExperience mode="lapsed-return" />);
      expect(screen.getByTestId("welcome-hero")).toBeInTheDocument();
      expect(screen.getByTestId("welcome-body")).toBeInTheDocument();
      expect(screen.queryByTestId("landing-hero")).not.toBeInTheDocument();
      expect(screen.queryByTestId("landing-body")).not.toBeInTheDocument();
    });
  });

  describe("lookup maps", () => {
    it("HERO map has correct component for each mode", () => {
      expect(HERO["first-visit"]).toBe(LandingHero);
      expect(HERO["recent-return"]).toBe(LandingHero);
      expect(HERO["lapsed-return"]).toBe(WelcomeHero);
    });

    it("BODY map has correct component for each mode", () => {
      expect(BODY["first-visit"]).toBe(LandingBody);
      expect(BODY["recent-return"]).toBe(WelcomeBody);
      expect(BODY["lapsed-return"]).toBe(WelcomeBody);
    });
  });
});
