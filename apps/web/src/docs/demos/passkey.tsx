"use client";

import { PasskeyPanel } from "@features/auth";

/** The passkey demo panel against the dev-only mock relying party. */
export function PasskeyDemo() {
  return <PasskeyPanel />;
}

/** Same panel with the registration-policy controls and options readout. */
export function PasskeyPolicyDemo() {
  return <PasskeyPanel showPolicy />;
}
