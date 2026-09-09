"use client";

import { MotionConfig } from "motion/react";

/**
 * App-wide Motion configuration.
 *
 * `reducedMotion="user"` ensures Motion components respect the OS-level
 * accessibility preference by default.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
