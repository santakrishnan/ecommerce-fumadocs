"use client";

import { DEFAULT_PROFILE_TIER, PROFILE_TIER_COOKIE, profileTierSchema } from "@config/profile-tier";
import { setProfileTier } from "@features/demo-settings/actions/set-profile-tier";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { type AcrLevel, type AuthEvidence, useAuth } from "../hooks/use-auth";

/**
 * Reads the profile tier from Non-httpOnly cookie. Falls back to the
 * default tier when the cookie is absent or invalid.
 */
function readProfileTier() {
  if (typeof document === "undefined") {
    return DEFAULT_PROFILE_TIER;
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${PROFILE_TIER_COOKIE}=([^;]*)`));
  const parsed = profileTierSchema.safeParse(match?.[1]);
  return parsed.success ? parsed.data : DEFAULT_PROFILE_TIER;
}
export interface GuardedLinkProps extends ComponentProps<typeof Link> {
  acr: AcrLevel;
  description?: string;
  evidence?: AuthEvidence[];
  title?: string;
}

const OTP_OVERLAY_DEFAULT_COPY = {
  title: "Become a Toyota iD member today",
  description:
    "Unlock a smarter, more personalized experience. Get inventory alerts and seamless dealership visits.",
} as const;

/**
 * `next/link` that hard-gates navigation. On a plain left-click, if the
 * requirement isn't met it freezes the URL and raises the OTP overlay;
 * otherwise it's a transparent Link.
 */
export function GuardedLink({
  href,
  acr,
  evidence,
  title = OTP_OVERLAY_DEFAULT_COPY.title,
  description = OTP_OVERLAY_DEFAULT_COPY.description,
  onClick,
  ...props
}: GuardedLinkProps) {
  const { meetsRequirement, showOtpOverlay } = useAuth();
  const router = useRouter();
  const target = typeof href === "string" ? href : (href.pathname ?? "");
  const gated = !meetsRequirement({ acr, evidence });

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }
    // Let the browser handle modified clicks (cmd/ctrl/shift/middle).
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }
    if (!gated) {
      return;
    }
    if (readProfileTier() !== "t0") {
      return;
    }
    event.preventDefault();
    showOtpOverlay({
      title,
      description,
      onVerified: () => {
        router.push(target);
        setProfileTier("t1");
      },
    });
  };

  return <Link href={href} onClick={handleClick} prefetch={false} {...props} />;
}
