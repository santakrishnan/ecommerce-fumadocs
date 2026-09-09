"use client";

import { ROUTES } from "@config/routes";
import { GuardedLink } from "@features/auth";
import { VDP_REFERRER_KEY } from "@shared/components/shared-hero-transition/config";
import { Button, ButtonGroup } from "@ucmp/ui";
import {
  IconCaretLeft,
  IconHome,
  IconHomeFilled,
  IconProfile,
  IconProfileFilled,
  IconSearch,
} from "@ucmp/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "utils";
import { useBackHref } from "~/shared/hooks/use-back-href";

type NavItem = "home" | "search" | "profile";
type NavVariant = "default" | "search" | "searchResults" | "compare" | "profile";
type IconComponent = typeof IconHome;

interface NavItemConfig {
  href?: string;
  Icon: IconComponent;
  IconActive: IconComponent;
  isActive: (pathname: string) => boolean;
  key: NavItem;
  label: string;
}

const DEFAULT_NAV_ITEMS: NavItemConfig[] = [
  {
    href: ROUTES.HOME,
    Icon: IconHome,
    IconActive: IconHomeFilled,
    isActive: (p) => !(p.startsWith(ROUTES.SEARCH) || p.startsWith(ROUTES.PROFILE)),
    key: "home",
    label: "Home",
  },
  {
    href: ROUTES.SEARCH,
    Icon: IconSearch,
    IconActive: IconSearch,
    isActive: (p) => p.startsWith(ROUTES.SEARCH),
    key: "search",
    label: "Search",
  },
  {
    href: ROUTES.PROFILE,
    Icon: IconProfile,
    IconActive: IconProfileFilled,
    isActive: (p) => p.startsWith(ROUTES.PROFILE),
    key: "profile",
    label: "Profile",
  },
];

/** Configuration for the single back button per variant. */

/**
 * Fixed container widths for each nav variant.
 *
 * These prevent layout reflow when the nav bar content changes (e.g. during
 * view transitions between pages). The values match the natural rendered width
 * of each variant's button group:
 * - Back button: 2 × size-12 icons (48px) + gap-1 (4px) + p-1 padding (8px) = ~110px
 * - Default nav: 3 × size-12 icons (144px) + ButtonGroup gaps (24px) = ~168px
 */
const NAV_WIDTH_BACK = "w-[110px]";
const NAV_WIDTH_DEFAULT = "w-[168px]";
const BACK_BUTTON_CONFIG: Record<
  Exclude<NavVariant, "default" | "compare">,
  { icon: IconComponent; label: string }
> = {
  search: { icon: IconHomeFilled, label: "Back to Home" },
  searchResults: { icon: IconSearch, label: "Back to Search" },
  profile: { icon: IconProfileFilled, label: "Back to Profile" },
};

export interface NavigationBarProps {
  /** Additional CSS classes for the outer wrapper. */
  className?: string;
  /**
   * When provided, the back button calls this instead of navigating via Link.
   * Used by the in-page search overlay to close without a route change.
   */
  onBack?: () => void;
  /**
   * Controls which navigation set is rendered.
   * - `"default"` — landing/site navigation: Home, Search, Profile (route-aware active state).
   * - `"search"` — single back button with Home icon.
   * - `"searchResults"` — single back button with Search icon.
   * - `"compare"` — single back button (caret + profile icon) that soft-navigates
   *   to the user's profile.
   * @default "default"
   */
  variant?: NavVariant;
}

/**
 * Resolves the back href for searchResults variant based on current route context.
 */
function resolveSearchResultsHref(isSearchResultsRoute: boolean, pathParts: string[]): string {
  if (isSearchResultsRoute) {
    return pathParts.slice(0, 3).join("/") || ROUTES.HOME;
  }

  // On VDP — read referrer from sessionStorage
  let vdpReferrer: string | null = null;
  try {
    vdpReferrer = sessionStorage.getItem(VDP_REFERRER_KEY);
  } catch {
    // sessionStorage unavailable
  }
  return vdpReferrer?.startsWith("/search/") ? vdpReferrer : ROUTES.HOME;
}

/**
 * Resolves the back href for the profile variant.
 * Returns the exact stored referrer if it's a /profile sub-path (e.g. /profile/watchlist),
 * otherwise falls back to /profile.
 */
function resolveProfileHref(): string {
  let vdpReferrer: string | null = null;
  try {
    vdpReferrer = sessionStorage.getItem(VDP_REFERRER_KEY);
  } catch {
    // sessionStorage unavailable
  }
  return vdpReferrer?.startsWith("/profile") ? vdpReferrer : ROUTES.PROFILE;
}

/**
 * Multi-variant navigation bar.
 *
 * Default variant: ButtonGroup with Home, Search, Profile (route-aware active state).
 *
 * Search & searchResults variants: A single back button with a leading caret icon
 * and a trailing context icon (Home or Search) that indicates the destination.
 *
 * Navigation behaviour (non-default variants):
 * - `search`: navigates to the session entry route ("/" or "/welcome-back") stored in
 *   sessionStorage. Defaults to "/" if no entry context is found.
 * - `searchResults` (auto-detected on /search/{id}/results): navigates to the
 *   parent conversation route (/search/{id}).
 */
export function NavigationBar({ variant = "default", className, onBack }: NavigationBarProps) {
  const pathname = usePathname();
  const backHref = useBackHref();

  if (variant === "compare") {
    // TODO: This profile link bypasses the isTierZero() gate check. T0 users
    // hit proxy.ts's redirect to home instead of seeing the sign-in splash.
    // Unify all profile entry points for consistent UX in a follow-up.
    return (
      <div className={cn(NAV_WIDTH_BACK, className)}>
        <Button
          aria-label="Back to Profile"
          className="w-auto gap-1 p-1"
          nativeButton={false}
          render={<Link href={ROUTES.PROFILE} />}
          size="icon"
          variant="primary"
        >
          <span className="inline-flex size-12 items-center justify-center rounded-full opacity-80">
            <IconCaretLeft className="size-5" />
          </span>
          <span className="inline-flex size-12 items-center justify-center rounded-full">
            <IconProfileFilled className="size-5" />
          </span>
        </Button>
      </div>
    );
  }

  if (variant !== "default") {
    // Auto-detect searchResults when on /search/{id}/results and the caller passed "search".
    const pathParts = pathname.split("/");
    const isSearchResultsRoute =
      pathParts.length === 4 && pathParts[1] === "search" && pathParts[3] === "results";
    const resolvedVariant: Exclude<NavVariant, "default"> =
      isSearchResultsRoute && variant === "search" ? "searchResults" : variant;

    const { icon: TrailingIcon, label } = BACK_BUTTON_CONFIG[resolvedVariant];

    // searchResults: navigate to parent conversation (/search/{id}) when on results page,
    // or read VDP referrer when on VDP page.
    // search: navigate to session entry route (/ or /welcome-back).
    // profile: navigate back to the stored referrer (e.g. /profile/watchlist) or /profile.
    let resolvedHref: string;
    if (resolvedVariant === "searchResults") {
      resolvedHref = resolveSearchResultsHref(isSearchResultsRoute, pathParts);
    } else if (resolvedVariant === "profile") {
      resolvedHref = resolveProfileHref();
    } else {
      resolvedHref = backHref;
    }

    /**
     * Back navigation strategy:
     *
     * 1. `onBack` provided (overlay context): the overlay manages its own
     *    close via view transition — no navigation needed.
     *
     * 2. searchResults → conversation (/search/{id}): same layout group,
     *    hard-replace is sufficient.
     *
     * 3. search → home/welcome-back: we MUST hard-navigate (window.location.replace)
     *    rather than soft-navigate (router.push / <Link>). A soft navigation
     *    preserves React state, which would leave the SearchOverlay on the
     *    landing page in its "open" state — showing the search experience
     *    instead of the clean landing page. A full page load resets all
     *    client state, guaranteeing the user sees the default landing view.
     *
     *    A fade curtain (surface-secondary background) is painted over the
     *    current view before the hard navigation fires, hiding the browser's
     *    white flash during the page load gap.
     */
    /** Guard against double-clicks — once back navigation is triggered,
     * subsequent clicks are no-ops. The flag is never reset because the
     * page will hard-navigate (full reload) or the overlay will close. */
    let isNavigating = false;

    const handleBack = () => {
      if (isNavigating) {
        return;
      }

      if (onBack) {
        onBack();
        return;
      }

      isNavigating = true;

      if (resolvedVariant === "searchResults") {
        // Hard-navigate back to the conversation. Turns rehydrate from IDB with
        // their `animationPlayed` flag already set, so the reveal never replays.
        window.location.replace(resolvedHref);
        return;
      }

      // search → home/welcome-back or profile → /profile: fade curtain → hard navigation
      const bg =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--color-surface-secondary")
          .trim() || "oklch(0.925 0 0)";
      const curtain = document.createElement("div");
      curtain.style.cssText = `position:fixed;inset:0;z-index:9999;background:${bg};opacity:0;transition:opacity 250ms ease-in-out;`;
      document.body.appendChild(curtain);
      curtain.getBoundingClientRect(); // force layout to enable transition
      curtain.style.opacity = "1";
      setTimeout(() => {
        window.location.replace(resolvedHref);
      }, 260);
    };

    const handleBackClick = (e: React.MouseEvent) => {
      // Allow standard link affordances (cmd+click, right-click) to work normally.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
        return;
      }
      e.preventDefault();
      handleBack();
    };

    return (
      <div className={cn(NAV_WIDTH_BACK, className)}>
        <Button
          aria-label={label}
          className="w-auto gap-1 p-1"
          nativeButton={false}
          onClick={handleBackClick}
          render={<Link href={resolvedHref} />}
          size="icon"
          variant="primary"
        >
          <span className="inline-flex size-12 items-center justify-center rounded-full opacity-80">
            <IconCaretLeft className="size-5" />
          </span>
          <span
            className="inline-flex size-12 animate-[slide-in-right_0.4s_cubic-bezier(0.34,1.56,0.64,1)_both] items-center justify-center rounded-full motion-reduce:animate-none"
            key={resolvedVariant}
          >
            <TrailingIcon className="size-5" />
          </span>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(NAV_WIDTH_DEFAULT, className)}>
      <ButtonGroup>
        {DEFAULT_NAV_ITEMS.map(({ key, Icon, IconActive, href, label, isActive }) => {
          const active = isActive(pathname);
          const ResolvedIcon = active ? IconActive : Icon;

          // Profile is the one gated target: it needs 1FA (OTP), so render a
          // GuardedLink that raises the challenge when the viewer isn't verified.
          let link: React.ReactElement | undefined;

          if (key === "profile" && href) {
            link = <GuardedLink acr={1} href={href} />;
          } else if (href) {
            link = <Link href={href} />;
          }

          return (
            <Button
              aria-current={active ? "page" : undefined}
              aria-label={label}
              key={key}
              nativeButton={!href}
              render={link}
              size="icon"
              variant="primary"
            >
              <ResolvedIcon className="size-5" />
            </Button>
          );
        })}
      </ButtonGroup>
    </div>
  );
}
