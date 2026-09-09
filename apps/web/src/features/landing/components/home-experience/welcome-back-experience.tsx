import { WelcomeBody } from "./welcome-body";
import { WelcomeHero } from "./welcome-hero";

/**
 * `/welcome-back` experience — the lapsed-return hero + body.
 *
 * Static at the page level: the edge (`proxy.ts`) guarantees only lapsed returns
 * reach `/welcome-back`, so there is no per-visitor mode decision to await here.
 * Session extension for these visitors is handled by `SessionKeepAlive`; the
 * body's own sections stream via their per-section boundaries.
 *
 * Note: The PageGrid wrapper and spacing classes are owned by the group layout
 * (`(home)/layout.tsx`), so this component returns its direct children only.
 */
export function WelcomeBackExperience() {
  return (
    <>
      <WelcomeHero />
      <WelcomeBody />
    </>
  );
}
