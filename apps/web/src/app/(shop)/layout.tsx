/**
 * Shop group layout — pass-through wrapper.
 *
 * This group intentionally does NOT follow the canonical grid layout pattern
 * used by (home), (profile), and (compare-page). Each child route is responsible
 * for providing its own <main> landmark (e.g. search/layout.tsx,
 * used-cars/details/layout.tsx).
 *
 * Justified exceptions:
 * - Search (`/search`): full-screen conversational UI with SearchProviders,
 *   SearchHeader, and no standard Footer.
 * - VDP (`/used-cars/details/…`): fixed overlay nav, hero transitions, and no
 *   standard header above the fold.
 */
export default function ShopGroupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
