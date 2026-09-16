"use client";

import { PasskeyPanel } from "@features/auth";

/** The passkey demo panel against the dev-only mock relying party (no nudge layers). */
export function PasskeyDemo() {
  return <PasskeyPanel showNudge={false} />;
}

/** Same panel with the registration-policy controls and options readout. */
export function PasskeyPolicyDemo() {
  return <PasskeyPanel showNudge={false} showPolicy />;
}

/** Sign-in nudge: capabilities, immediate mediation, conditional UI, RP hint, with a visible trace. */
export function PasskeyNudgeDemo() {
  return <PasskeyPanel showNudge />;
}
