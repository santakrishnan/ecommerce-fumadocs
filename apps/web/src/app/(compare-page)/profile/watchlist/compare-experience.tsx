import type { CompareComparisonSection } from "@features/compare";
import { COMPARE_SECTIONS, type CompareCategoryKey, CompareSection } from "@features/compare";
import { getCompareVehicles } from "@features/compare/bff";
import { getWatchlist } from "@features/profile/watchlist/bff";

const INITIAL_COLUMN_COUNT = 3;

const COMPARISON_SECTIONS: CompareComparisonSection[] = COMPARE_SECTIONS.map((s) => ({
  title: s.title,
  category: s.id as CompareCategoryKey,
  faq: s.faq,
}));

async function CompareExperience() {
  const watchlistResult = await getWatchlist();
  const watchlistVins = watchlistResult.success ? watchlistResult.data.map((item) => item.vin) : [];

  const compareResult = await getCompareVehicles(watchlistVins);
  const allVehicles = compareResult.success ? compareResult.data : [];

  if (allVehicles.length === 0) {
    return (
      <p className="body-lg text-text-secondary">
        Save vehicles to your watchlist to compare them side by side.
      </p>
    );
  }

  const initialSelectedVins = allVehicles.slice(0, INITIAL_COLUMN_COUNT).map((v) => v.vin);

  return (
    <CompareSection
      allVehicles={allVehicles}
      initialSelectedVins={initialSelectedVins}
      sections={COMPARISON_SECTIONS}
    />
  );
}

export { CompareExperience };
