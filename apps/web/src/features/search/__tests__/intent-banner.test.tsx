/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import {
  intentBannerCompleteFixture,
  intentBannerLoadingFixture,
  intentBannerLoadingNoStatusFixture,
  intentBannerMinimalFixture,
  intentBannerNoActionFixture,
} from "../__fixtures__/intent-banner.fixture";
import { IntentBanner } from "../components/intent-banner";

const HIGHLANDER_REGEX = /Highlander Hybrid is the clear winner/;
const INTENT_BANNER_REGEX = /intent banner/i;

describe("IntentBanner", () => {
  // ─── User Intent Eyebrow ───────────────────────────────────────────────────

  describe("User Intent Eyebrow", () => {
    it("renders the intent eyebrow when provided", () => {
      render(<IntentBanner {...intentBannerCompleteFixture} />);
      expect(screen.getByTestId("intent-banner-eyebrow")).toHaveTextContent(
        "Which has the most cargo space?"
      );
    });

    it("uses the subhead-sm typography variant for the eyebrow text", () => {
      render(<IntentBanner {...intentBannerCompleteFixture} />);

      const eyebrowText = screen.getByText("Which has the most cargo space?");
      expect(eyebrowText).toHaveClass("subhead-sm", "text-text-tertiary");
      expect(eyebrowText).not.toHaveClass("font-semibold", "text-sm", "leading-body");
    });

    it("does not render the eyebrow when not provided", () => {
      render(<IntentBanner {...intentBannerMinimalFixture} />);
      expect(screen.queryByTestId("intent-banner-eyebrow")).not.toBeInTheDocument();
    });

    it("renders eyebrow text when intentEyebrow is the object form", () => {
      render(
        <IntentBanner
          intentEyebrow={{ text: "You removed Blue from your preferences." }}
          response="Here are updated results."
        />
      );
      expect(screen.getByTestId("intent-banner-eyebrow")).toHaveTextContent(
        "You removed Blue from your preferences."
      );
    });

    it("renders the icon container when intentEyebrow object includes an icon", () => {
      render(
        <IntentBanner
          intentEyebrow={{
            text: "You removed Blue from your preferences.",
            icon: <svg aria-hidden="true" data-testid="mock-icon" />,
          }}
          response="Here are updated results."
        />
      );
      expect(screen.getByTestId("intent-banner-eyebrow-icon")).toBeInTheDocument();
      expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
    });

    it("does not render the icon container when intentEyebrow is a plain string", () => {
      render(
        <IntentBanner intentEyebrow="Which has the most cargo space?" response="Some answer." />
      );
      expect(screen.queryByTestId("intent-banner-eyebrow-icon")).not.toBeInTheDocument();
    });

    it("does not render the toggle icon when text fits in the container", () => {
      render(<IntentBanner {...intentBannerCompleteFixture} />);
      expect(screen.queryByTestId("intent-banner-eyebrow-toggle")).not.toBeInTheDocument();
      expect(screen.getByTestId("intent-banner-eyebrow")).toHaveAttribute("data-overflow", "false");
    });

    it("renders the toggle icon and expands text when the eyebrow overflows", async () => {
      const originalScrollWidth = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "scrollWidth"
      );
      const originalClientWidth = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "clientWidth"
      );
      Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
        configurable: true,
        get() {
          return 600;
        },
      });
      Object.defineProperty(HTMLElement.prototype, "clientWidth", {
        configurable: true,
        get() {
          return 300;
        },
      });

      try {
        const longText =
          "These are three cars our friends drive that we like. We need to make sure they fit a stroller and a dog crate.";
        render(<IntentBanner intentEyebrow={longText} response="Some answer" />);

        const eyebrow = screen.getByTestId("intent-banner-eyebrow");
        const toggleIcon = screen.getByTestId("intent-banner-eyebrow-toggle");
        expect(toggleIcon).toBeInTheDocument();
        expect(eyebrow).toHaveAttribute("aria-expanded", "false");

        const { default: userEvent } = await import("@testing-library/user-event");
        const user = userEvent.setup();
        await user.click(eyebrow);

        expect(screen.getByTestId("intent-banner-eyebrow")).toHaveAttribute(
          "aria-expanded",
          "true"
        );
        expect(screen.getByTestId("intent-banner-eyebrow")).toHaveAttribute(
          "data-expanded",
          "true"
        );
      } finally {
        if (originalScrollWidth) {
          Object.defineProperty(HTMLElement.prototype, "scrollWidth", originalScrollWidth);
        }
        if (originalClientWidth) {
          Object.defineProperty(HTMLElement.prototype, "clientWidth", originalClientWidth);
        }
      }
    });
  });

  // ─── Loading / In-Progress State ───────────────────────────────────────────

  describe("Loading / In-Progress State", () => {
    it("renders the loading indicator when isLoading is true", () => {
      render(<IntentBanner {...intentBannerLoadingFixture} />);
      expect(screen.getByTestId("intent-banner-loading")).toBeInTheDocument();
    });

    it("renders 'Working on it...' status text during loading", () => {
      render(<IntentBanner {...intentBannerLoadingFixture} />);
      expect(screen.getByText("Working on it...")).toBeInTheDocument();
    });

    it("renders loading state without status text prop", () => {
      render(<IntentBanner {...intentBannerLoadingNoStatusFixture} />);
      expect(screen.getByTestId("intent-banner-loading")).toBeInTheDocument();
    });

    it("does not render response text while loading", () => {
      render(<IntentBanner {...intentBannerLoadingFixture} />);
      expect(screen.queryByTestId("intent-banner-response")).not.toBeInTheDocument();
    });

    it("does not render CTA actions while loading", () => {
      render(<IntentBanner {...intentBannerLoadingFixture} />);
      expect(screen.queryByTestId("intent-banner-cta")).not.toBeInTheDocument();
    });

    it("does not render keywords section when beats is empty", () => {
      render(<IntentBanner beats={[]} isLoading />);
      expect(screen.queryByText("SUVs")).not.toBeInTheDocument();
    });
  });

  // ─── Final Response State ──────────────────────────────────────────────────

  describe("Final Response State", () => {
    it("renders the response text when complete", () => {
      render(<IntentBanner {...intentBannerCompleteFixture} />);
      expect(screen.getByTestId("intent-banner-response")).toBeInTheDocument();
      expect(screen.getByText(HIGHLANDER_REGEX)).toBeInTheDocument();
    });

    it("does not render loading spinner when response is complete", () => {
      render(<IntentBanner {...intentBannerCompleteFixture} />);
      expect(screen.queryByTestId("intent-banner-loading")).not.toBeInTheDocument();
    });

    it("does not render response when responseText is empty string", () => {
      render(<IntentBanner response="" />);
      expect(screen.queryByTestId("intent-banner-response")).not.toBeInTheDocument();
    });

    it("does not render response when responseText is undefined", () => {
      render(<IntentBanner isLoading={false} />);
      expect(screen.queryByTestId("intent-banner-response")).not.toBeInTheDocument();
    });

    it("clearly separates in-progress from complete state", () => {
      const { rerender } = render(<IntentBanner {...intentBannerLoadingFixture} />);
      expect(screen.getByTestId("intent-banner-loading")).toBeInTheDocument();
      expect(screen.queryByTestId("intent-banner-response")).not.toBeInTheDocument();

      rerender(<IntentBanner {...intentBannerCompleteFixture} />);
      expect(screen.queryByTestId("intent-banner-loading")).not.toBeInTheDocument();
      expect(screen.getByTestId("intent-banner-response")).toBeInTheDocument();
    });

    it("supports follow-up search: response → new eyebrow + loading → new response", () => {
      // 1. Initial response is visible
      const { rerender } = render(<IntentBanner {...intentBannerCompleteFixture} />);
      expect(screen.getByTestId("intent-banner-eyebrow")).toHaveTextContent(
        "Which has the most cargo space?"
      );
      expect(screen.getByTestId("intent-banner-response")).toBeInTheDocument();
      expect(screen.queryByTestId("intent-banner-loading")).not.toBeInTheDocument();

      // 2. Follow-up search: new eyebrow + loading replaces response
      rerender(
        <IntentBanner
          intentEyebrow="What's good for city driving?"
          isLoading
          statusText="Working on it..."
        />
      );
      expect(screen.getByTestId("intent-banner-eyebrow")).toHaveTextContent(
        "What's good for city driving?"
      );
      expect(screen.getByTestId("intent-banner-loading")).toBeInTheDocument();
      expect(screen.queryByTestId("intent-banner-response")).not.toBeInTheDocument();

      // 3. New response arrives
      rerender(
        <IntentBanner
          intentEyebrow="What's good for city driving?"
          isLoading={false}
          response="Here are four compact, fuel-efficient picks for Brooklyn."
        />
      );
      expect(screen.queryByTestId("intent-banner-loading")).not.toBeInTheDocument();
      expect(screen.getByTestId("intent-banner-response")).toHaveTextContent(
        "Here are four compact, fuel-efficient picks for Brooklyn."
      );
    });

    it("escapes HTML in responseText (XSS protection)", () => {
      render(
        <IntentBanner isLoading={false} response={'<script>alert("xss")</script>Safe text'} />
      );
      const response = screen.getByTestId("intent-banner-response");
      // Should display as text, not execute as HTML
      expect(response).toHaveTextContent('<script>alert("xss")</script>Safe text');
      expect(response.querySelector("script")).toBeNull();
    });
  });

  // ─── CTA Actions ───────────────────────────────────────────────────────────

  describe("CTA Actions", () => {
    it("renders a single CTA button when actions array has one entry", () => {
      render(<IntentBanner {...intentBannerCompleteFixture} />);
      expect(screen.getByTestId("intent-banner-cta")).toBeInTheDocument();
      expect(screen.getByText("Browse Highlander Hybrids")).toBeInTheDocument();
    });

    it("renders multiple CTA buttons when actions array is provided", () => {
      render(
        <IntentBanner
          actions={[
            { label: "Browse SUVs", href: "/search/suv" },
            { label: "Compare Models", href: "/compare" },
            { label: "View Deals" },
          ]}
          response="Here are some options."
        />
      );
      expect(screen.getByTestId("intent-banner-cta")).toBeInTheDocument();
      expect(screen.getByText("Browse SUVs")).toBeInTheDocument();
      expect(screen.getByText("Compare Models")).toBeInTheDocument();
      expect(screen.getByText("View Deals")).toBeInTheDocument();
    });

    it("renders CTA as a link when href is provided", () => {
      render(
        <IntentBanner
          actions={[{ label: "Go to page", href: "/some-path" }]}
          response="Response text"
        />
      );
      const link = screen.getByText("Go to page").closest("a");
      expect(link).toHaveAttribute("href", "/some-path");
    });

    it("renders CTA as a button with onClick when no href", async () => {
      const handleClick = vi.fn();
      render(
        <IntentBanner
          actions={[{ label: "Click me", onClick: handleClick }]}
          response="Response text"
        />
      );

      const { default: userEvent } = await import("@testing-library/user-event");
      const user = userEvent.setup();
      await user.click(screen.getByText("Click me"));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not render CTA section when no actions provided", () => {
      render(<IntentBanner {...intentBannerNoActionFixture} />);
      expect(screen.queryByTestId("intent-banner-cta")).not.toBeInTheDocument();
    });

    it("does not render CTA section for minimal fixture", () => {
      render(<IntentBanner {...intentBannerMinimalFixture} />);
      expect(screen.queryByTestId("intent-banner-cta")).not.toBeInTheDocument();
    });

    it("does not render CTA section when actions is an empty array", () => {
      render(<IntentBanner actions={[]} response="Some response" />);
      expect(screen.queryByTestId("intent-banner-cta")).not.toBeInTheDocument();
    });

    it("renders all actions when multiple provided", () => {
      render(
        <IntentBanner
          actions={[
            { label: "New Action", href: "/new" },
            { label: "Another Action", href: "/another" },
          ]}
          response="Response text"
        />
      );
      expect(screen.getByText("New Action")).toBeInTheDocument();
      expect(screen.getByText("Another Action")).toBeInTheDocument();
    });
  });

  // ─── Accessibility ─────────────────────────────────────────────────────────

  describe("Accessibility", () => {
    it("has an accessible section landmark with aria-label", () => {
      render(<IntentBanner {...intentBannerCompleteFixture} />);
      expect(screen.getByRole("region", { name: INTENT_BANNER_REGEX })).toBeInTheDocument();
    });

    it("uses role=status with aria-live for loading state", () => {
      render(<IntentBanner {...intentBannerLoadingFixture} />);
      const status = screen.getByRole("status");
      expect(status).toHaveAttribute("aria-live", "polite");
    });

    it("CTA links are keyboard-accessible", () => {
      render(<IntentBanner actions={[{ label: "Browse", href: "/browse" }]} response="Response" />);
      const link = screen.getByText("Browse").closest("a");
      expect(link).not.toBeNull();
      expect(link?.getAttribute("href")).toBe("/browse");
    });
  });

  // ─── Conditional Visibility ────────────────────────────────────────────────

  describe("Conditional Visibility", () => {
    it("renders nothing but the section when all props are empty", () => {
      render(<IntentBanner />);
      expect(screen.queryByTestId("intent-banner-eyebrow")).not.toBeInTheDocument();
      expect(screen.queryByTestId("intent-banner-loading")).not.toBeInTheDocument();
      expect(screen.queryByTestId("intent-banner-response")).not.toBeInTheDocument();
      expect(screen.queryByTestId("intent-banner-cta")).not.toBeInTheDocument();
      // The section landmark still exists
      expect(screen.getByRole("region", { name: INTENT_BANNER_REGEX })).toBeInTheDocument();
    });

    it("hides eyebrow when intentEyebrow is undefined", () => {
      render(<IntentBanner response="Response only" />);
      expect(screen.queryByTestId("intent-banner-eyebrow")).not.toBeInTheDocument();
      expect(screen.getByTestId("intent-banner-response")).toBeInTheDocument();
    });

    it("hides CTA when actions are not provided", () => {
      render(<IntentBanner response="Response only" />);
      expect(screen.queryByTestId("intent-banner-cta")).not.toBeInTheDocument();
    });
  });

  // ─── Reusability & Styling ─────────────────────────────────────────────────

  describe("Reusability & Styling", () => {
    it("accepts a custom className", () => {
      const { container } = render(
        <IntentBanner {...intentBannerMinimalFixture} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("applies responsive width classes", () => {
      const { container } = render(<IntentBanner {...intentBannerMinimalFixture} />);
      const el = container.firstChild as HTMLElement;
      expect(el.className).toContain("w-full");
    });

    it("applies max-w-full to prevent overflow", () => {
      const { container } = render(<IntentBanner {...intentBannerMinimalFixture} />);
      const el = container.firstChild as HTMLElement;
      expect(el.className).toContain("max-w-full");
    });
  });

  // ─── Data Contract ─────────────────────────────────────────────────────────

  describe("Data Contract (Presentation Only)", () => {
    it("does not make any fetch or API calls", () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");
      render(<IntentBanner {...intentBannerCompleteFixture} />);
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });

    it("renders all provided props without transformation", () => {
      const props = {
        intentEyebrow: "Test eyebrow",
        response: "Test response",
        actions: [{ label: "Test CTA", href: "/test" }],
      };
      render(<IntentBanner {...props} />);
      expect(screen.getByTestId("intent-banner-eyebrow")).toHaveTextContent("Test eyebrow");
      expect(screen.getByTestId("intent-banner-response")).toHaveTextContent("Test response");
      expect(screen.getByText("Test CTA")).toBeInTheDocument();
    });
  });

  // ─── Preference Removal Notification ────────────────────────────────────────

  describe("Preference Removal Notification", () => {
    it("renders eyebrow text when intentEyebrow is the object form", () => {
      render(
        <IntentBanner
          intentEyebrow={{ text: "Removed Blue from your preferences." }}
          response="Here are updated results."
        />
      );
      expect(screen.getByTestId("intent-banner-eyebrow")).toHaveTextContent(
        "Removed Blue from your preferences."
      );
    });

    it("renders the icon container when intentEyebrow object includes an icon", () => {
      render(
        <IntentBanner
          intentEyebrow={{
            text: "Removed Blue from your preferences.",
            icon: <span data-testid="mock-icon">icon</span>,
          }}
          response="Here are updated results."
        />
      );
      expect(screen.getByTestId("intent-banner-eyebrow-icon")).toBeInTheDocument();
      expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
    });

    it("does not render the icon container when intentEyebrow is a plain string", () => {
      render(
        <IntentBanner
          intentEyebrow="Which has the most cargo space?"
          response="Here are updated results."
        />
      );
      expect(screen.queryByTestId("intent-banner-eyebrow-icon")).not.toBeInTheDocument();
      expect(screen.getByTestId("intent-banner-eyebrow")).toBeInTheDocument();
    });

    it("does not render the icon container when intentEyebrow object has no icon", () => {
      render(
        <IntentBanner
          intentEyebrow={{ text: "Removed Blue from your preferences." }}
          response="Here are updated results."
        />
      );
      expect(screen.queryByTestId("intent-banner-eyebrow-icon")).not.toBeInTheDocument();
      expect(screen.getByTestId("intent-banner-eyebrow")).toBeInTheDocument();
    });
  });
});
