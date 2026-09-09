/// <reference types="@testing-library/jest-dom" />
import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import {
  READINESS_CONTINUE_LABEL,
  READINESS_DESCRIPTION,
  READINESS_TITLE,
} from "../origination-steps/readiness/readiness-content";
import { ReadinessStepScreen } from "../origination-steps/readiness/readiness-step-screen";

// ─── Router mock ──────────────────────────────────────────────────────────────
// vi.mock() is hoisted above all imports by Vitest's transform, so any variable
// the factory closure references must also be hoisted via vi.hoisted() — plain
// `const` declarations above vi.mock() are not yet initialized at hoist time.

const { mockBack } = vi.hoisted(() => ({ mockBack: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: mockBack, push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// ─── Regex constants ──────────────────────────────────────────────────────────

const CLOSE_BUTTON_NAME = /close/i;

// ─── Helpers ──────────────────────────────────────────────────────────────────

// In production the server page passes <ReadinessItemCard> as children.
// ReadinessStepScreen's only job is to forward children into OriginationPanel's
// content slot — card content is tested separately in readiness-item-card.test.tsx.
function renderScreen() {
  return render(
    <ReadinessStepScreen>
      <div data-testid="card-slot" />
    </ReadinessStepScreen>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ReadinessStepScreen", () => {
  describe("copy", () => {
    it("renders the page title", () => {
      renderScreen();
      expect(screen.getByText(READINESS_TITLE)).toBeInTheDocument();
    });

    it("renders the description", () => {
      renderScreen();
      expect(screen.getByText(READINESS_DESCRIPTION)).toBeInTheDocument();
    });

    it("forwards children into the panel content slot", () => {
      renderScreen();
      expect(screen.getByTestId("card-slot")).toBeInTheDocument();
    });
  });

  describe("Continue action", () => {
    it("renders the Continue button", () => {
      renderScreen();
      // Renders as <a role="button"> — Base UI ButtonPrimitive sets role="button"
      // on non-native-button renders.
      expect(screen.getByRole("button", { name: READINESS_CONTINUE_LABEL })).toBeInTheDocument();
    });

    it("Continue button points to the originations route", () => {
      renderScreen();
      const continueEl = screen.getByRole("button", { name: READINESS_CONTINUE_LABEL });
      expect(continueEl).toHaveAttribute("href", "/originations");
    });
  });

  describe("Close action", () => {
    it("renders the close button", () => {
      renderScreen();
      expect(screen.getByRole("button", { name: CLOSE_BUTTON_NAME })).toBeInTheDocument();
    });

    it("clicking the close button calls router.back()", async () => {
      const user = userEvent.setup();
      renderScreen();

      await user.click(screen.getByRole("button", { name: CLOSE_BUTTON_NAME }));

      expect(mockBack).toHaveBeenCalledOnce();
    });
  });

  describe("progress bar", () => {
    it("does not render a progress bar (pre-flow screen)", () => {
      renderScreen();
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });
  });
});
