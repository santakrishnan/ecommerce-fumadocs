import { WelcomeBackExperience } from "@features/landing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome back",
  description:
    "I've found new matches from your recent searches for you to jump back in or let me know if I can help you with something else",
};

/**
 * `/welcome-back` — static lapsed-return experience.
 *
 * The edge (`proxy.ts`) redirects non-lapsed visitors away, so this page has no
 * per-visitor decision to make and prerenders end-to-end.
 */
export default function WelcomePage() {
  return <WelcomeBackExperience />;
}
