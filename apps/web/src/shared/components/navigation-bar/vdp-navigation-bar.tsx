"use client";

import { VDP_REFERRER_KEY } from "@shared/components/shared-hero-transition/config";
import { useEffect, useState } from "react";
import { NavigationBar } from "./navigation-bar";

/**
 * VDP-specific navigation bar that conditionally renders:
 * - "Back to Search" (search icon) when the user arrived from /search/[id]
 * - "Back to Profile" (profile icon) when the user arrived from /profile
 * - "Back to Home" (home icon) when the user arrived from home/welcome-back
 *
 * Reads VDP_REFERRER_KEY from sessionStorage (written by HeroTransitionProvider
 * or the profile appointment card).
 * Defers rendering until the client has resolved the referrer to prevent
 * the back button flashing between variants on page refresh.
 */
export function VdpNavigationBar() {
  const [variant, setVariant] = useState<"search" | "searchResults" | "profile" | null>(null);

  useEffect(() => {
    let referrer = "/";
    try {
      referrer = sessionStorage.getItem(VDP_REFERRER_KEY) ?? "/";
    } catch {
      // sessionStorage unavailable
    }

    if (referrer.startsWith("/search/")) {
      setVariant("searchResults");
    } else if (referrer.startsWith("/profile")) {
      setVariant("profile");
    } else {
      setVariant("search");
    }
  }, []);

  // Render an invisible placeholder until the client resolves the correct variant,
  // preventing the flash of the wrong button on refresh while preserving layout space.
  if (variant === null) {
    return <div aria-hidden="true" className="w-[110px]" />;
  }

  return <NavigationBar variant={variant} />;
}
