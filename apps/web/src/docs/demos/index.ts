import type { ComponentType } from "react";
import { GuardedLinkDemo } from "./guarded-link";
import { OtpFlowDemo, OtpStartDarkDemo, OtpStartDemo, OtpVerifyDemo } from "./otp";

/**
 * Registry of live demos, keyed by the name used in MDX
 * (`<ComponentPreview name="otp-start" />`) and by the standalone preview
 * route (`/preview/otp-start`). To add a demo: write a wrapper in this folder,
 * then add one line here.
 */
export const demos = {
  "otp-start": OtpStartDemo,
  "otp-start-dark": OtpStartDarkDemo,
  "otp-verify": OtpVerifyDemo,
  "otp-flow": OtpFlowDemo,
  "guarded-link": GuardedLinkDemo,
} satisfies Record<string, ComponentType>;

export type DemoName = keyof typeof demos;

export const demoNames = Object.keys(demos) as DemoName[];

export function isDemoName(value: string): value is DemoName {
  return value in demos;
}
