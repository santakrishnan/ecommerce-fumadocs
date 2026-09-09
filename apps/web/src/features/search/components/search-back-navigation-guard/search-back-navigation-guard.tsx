"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// ─── Route predicates ────────────────────────────────────────────────────────

const isSearchPath = (path: string) => path.startsWith("/search");
// VDP is a legitimate forward navigation from search (hero transition).
// Do NOT hard-reload — it would destroy the animation overlay.
const isVdpPath = (path: string) => path.startsWith("/used-cars/details/");

/**
 * Decide whether a transition FROM `fromPath` TO `toPath` must be forced into a
 * hard reload. True only when leaving `/search/*` for a non-search, non-VDP
 * route.
 */
const shouldHardReload = (fromPath: string, toPath: string) =>
  isSearchPath(fromPath) && !isSearchPath(toPath) && !isVdpPath(toPath);

// ─── Minimal Navigation API typings ──────────────────────────────────────────
// The Navigation API is not yet in TypeScript's lib.dom, so we type only the
// surface we consume here.

type NavigationType = "push" | "replace" | "reload" | "traverse";

type NavigateEvent = Event & {
  readonly navigationType: NavigationType;
  readonly destination: { readonly url: string };
};

interface NavigationApi {
  addEventListener(type: "navigate", listener: (event: NavigateEvent) => void): void;
  removeEventListener(type: "navigate", listener: (event: NavigateEvent) => void): void;
}

const getNavigationApi = (): NavigationApi | null => {
  if (typeof window === "undefined") {
    return null;
  }
  return (window as unknown as { navigation?: NavigationApi }).navigation ?? null;
};

/**
 * SearchExitGuard — must be placed in a layout that persists across route
 * group transitions (typically the root layout). Detects when the browser
 * back/forward button transitions FROM `/search/*` to a non-search route and
 * forces a hard reload.
 *
 * ## Why?
 *
 * The search pages live under the `(shop)` route group while the home/welcome
 * pages live under `(home)`. These groups have completely different layout
 * trees. When the browser back button triggers a soft navigation across these
 * boundaries, the combination of `cachedNavigations`, `viewTransition`, and the
 * heavy state tear-down (SearchProviders, ConversationalSearchBackdrop) causes
 * either a blank page or a visually broken state.
 *
 * ## How?
 *
 * Preferred path — the **Navigation API**. We listen for the `navigate` event
 * and act only when `navigationType === "traverse"` (i.e. back/forward). This:
 *
 *   1. Fires *before* the View Transition snapshot is captured, so the user
 *      never sees a frame of the broken morph.
 *   2. Is scoped to back/forward only — programmatic soft navs (logo tap,
 *      breadcrumb) keep their smooth transition and are never hard-reloaded.
 *   3. Exposes the full destination URL, so query params (`?utm_source=…`) and
 *      hash survive the hard reload.
 *
 * Fallback path — browsers without the Navigation API (e.g. older Safari) use
 * a `popstate`-scoped pathname diff. `popstate` fires only for back/forward, so
 * we still avoid clobbering programmatic navigations; query/hash are recovered
 * from `window.location`.
 */
export function SearchExitGuard() {
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  // Set by `popstate` (fallback only) to mark the next pathname change as a
  // back/forward traversal.
  const poppedRef = useRef(false);

  // ── Preferred: Navigation API (Chromium, modern Firefox) ──
  useEffect(() => {
    const navigation = getNavigationApi();
    if (!navigation) {
      return;
    }

    const onNavigate = (event: NavigateEvent) => {
      // Only back/forward traversals hit the stale-snapshot bug.
      if (event.navigationType !== "traverse") {
        return;
      }

      // During the navigate event, `window.location` is still the origin page.
      const fromPath = window.location.pathname;
      const destination = new URL(event.destination.url, window.location.origin);

      if (shouldHardReload(fromPath, destination.pathname)) {
        // Preserve the full destination URL (path + query + hash).
        window.location.replace(`${destination.pathname}${destination.search}${destination.hash}`);
      }
    };

    navigation.addEventListener("navigate", onNavigate);
    return () => navigation.removeEventListener("navigate", onNavigate);
  }, []);

  // ── Fallback: popstate-scoped pathname diff (no Navigation API) ──
  useEffect(() => {
    if (getNavigationApi()) {
      return;
    }

    const onPopState = () => {
      poppedRef.current = true;
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    // Skip entirely when the Navigation API is handling things.
    if (getNavigationApi()) {
      prevPathnameRef.current = pathname;
      return;
    }

    const fromPath = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    // Only act on back/forward traversals.
    const wasTraversal = poppedRef.current;
    poppedRef.current = false;

    if (wasTraversal && shouldHardReload(fromPath, pathname)) {
      // Recover query/hash from the already-updated location.
      window.location.replace(`${pathname}${window.location.search}${window.location.hash}`);
    }
  }, [pathname]);

  return null;
}
