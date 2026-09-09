import type { IntentBannerProps } from "../components/intent-banner";

/** Complete response with all optional fields */
export const intentBannerCompleteFixture: IntentBannerProps = {
  intentEyebrow: "Which has the most cargo space?",
  isLoading: false,
  response:
    "The Highlander Hybrid is the clear winner. Its third row folds flat to create a much larger cargo area. The Telluride is also a strong option, but the others may feel tight if cargo space is important.",
  actions: [{ label: "Browse Highlander Hybrids", href: "/search/highlander-hybrid" }],
};

/** Loading/in-progress state */
export const intentBannerLoadingFixture: IntentBannerProps = {
  intentEyebrow: "Which has the most cargo space?",
  isLoading: true,
  statusText: "Working on it...",
  beats: [
    { beat: "suv", message: "SUVs", status: "done" },
    { beat: "cargo", message: "Cargo space", status: "done" },
    { beat: "fuel", message: "Fuel efficient", status: "active" },
  ],
};

/** Response complete with no CTA action */
export const intentBannerNoActionFixture: IntentBannerProps = {
  intentEyebrow: "What's good for city driving?",
  isLoading: false,
  response:
    "Since you're in Brooklyn, it's going to be important to balance good fuel economy in stop-and-go traffic, compact size for easy parking, space for all your cargo, and let's not forget safety features. Here are the top four models that are perfect for you.",
};

/** Minimal – only the response text, no eyebrow or action */
export const intentBannerMinimalFixture: IntentBannerProps = {
  isLoading: false,
  response: "Here are four models worth considering based on your needs.",
};

/** Loading state without status text */
export const intentBannerLoadingNoStatusFixture: IntentBannerProps = {
  isLoading: true,
};
