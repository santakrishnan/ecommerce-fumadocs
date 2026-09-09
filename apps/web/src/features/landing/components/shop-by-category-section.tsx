import { SectionHeader } from "@shared/components/section-header";
import { getBrowseByStyleResponse } from "../bff/services/get-browse-by-style-response";
import type { BrowseByStyleCard } from "../contracts/browse-by-style.schema";
import type { CategoryCardData } from "../types";
import { CategoryCarousel } from "./category-card/category-carousel";

const LOCALHOST_ORIGIN_RE = /^https?:\/\/localhost(?::\d+)?(?=\/)/;
const FALLBACK_TITLE = "BROWSE BY STYLE";

/** Map a Browse By Style card (contract shape) to the CategoryCard view model. */
function toCategoryCard(card: BrowseByStyleCard): CategoryCardData {
  const { seed, target } = card.action;
  return {
    name: card.title,
    description: card.description ?? "",
    imageAlt: card.image?.alt ?? "",
    // Strip an absolute origin so next/image uses the local /public path.
    imageUrl: (card.image?.src ?? "").replace(LOCALHOST_ORIGIN_RE, ""),
    shopUrl: seed?.categoryKey ? `${target}?type=${encodeURIComponent(seed.categoryKey)}` : target,
  };
}

/**
 * Shop by Category ("Browse by Style") section.
 *
 * Sources its data from `getBrowseByStyleResponse()` — the fixture-backed,
 * contract-validated single source of truth — and maps the response cards into
 * the `CategoryCard` view model. Returns `null` when there are no categories,
 * hiding the section entirely from the DOM.
 */
export function ShopByCategorySection({ className }: { className?: string } = {}) {
  const response = getBrowseByStyleResponse();
  const isSuccess = "items" in response;

  const title = isSuccess ? response.title : FALLBACK_TITLE;
  const subtitle = isSuccess ? (response.subtitle ?? "") : "";
  const categories: CategoryCardData[] = isSuccess
    ? response.items.filter((card) => card.image?.src).map(toCategoryCard)
    : [];

  if (categories.length === 0) {
    return null;
  }

  return (
    <section aria-label="Browse by style" className={className}>
      <div className="mb-4">
        <SectionHeader subtitle={subtitle} title={title} />
      </div>
      <CategoryCarousel categories={categories} colSpan={{ sm: 3, md: 3, lg: 3 }} />
    </section>
  );
}
