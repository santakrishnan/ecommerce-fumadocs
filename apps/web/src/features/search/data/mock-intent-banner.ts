import type { IntentBannerProps } from "../components/intent-banner";

/**
 * Mock intent-banner data used for demo/dev purposes.
 * Each scenario represents a distinct visual state of the IntentBanner component.
 */

/** Complete response with action CTA */
export const mockIntentBannerComplete: IntentBannerProps = {
  intentEyebrow: "Which has the most cargo space?",
  isLoading: false,
  response:
    "The Highlander Hybrid is the clear winner. Its third row folds flat to create a much larger cargo area. The Telluride is also a strong option, but the others may feel tight if cargo space is important.",
  actions: [{ label: "Browse Highlander Hybrids", href: "/search/highlander-hybrid" }],
};

/** Loading / in-progress state with a beats checklist */
export const mockIntentBannerLoading: IntentBannerProps = {
  intentEyebrow: "What's good for city driving?",
  isLoading: true,
  statusText: "Working on it...",
  beats: [
    { beat: "suv", message: "SUVs", status: "done" },
    { beat: "cargo", message: "Cargo space", status: "done" },
    { beat: "fuel", message: "Fuel efficient", status: "done" },
    { beat: "city", message: "City driving", status: "active" },
  ],
};

/** Completed response without any CTA action */
export const mockIntentBannerNoAction: IntentBannerProps = {
  isLoading: false,
  response:
    "Since you're in Brooklyn, it's going to be important to balance good fuel economy in stop-and-go traffic, compact size for easy parking, space for all your cargo, and let's not forget safety features. Here are the top four models that are perfect for you.",
};
