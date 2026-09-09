import { CARD_HOVER_SCALE, CardCarousel, type CardCarouselProps } from "@shared/components/card";
import type { CategoryCardData } from "../../types";
import { CategoryCardLink } from "./category-card-link";

export interface CategoryCarouselProps {
  categories: CategoryCardData[];
  colSpan?: CardCarouselProps<CategoryCardData>["colSpan"];
}

export function CategoryCarousel({ categories, colSpan }: CategoryCarouselProps) {
  return (
    <CardCarousel
      colSpan={colSpan}
      getItemKey={(category, index) => `${category.shopUrl}-${category.name}-${index}`}
      hoverScaleRatio={CARD_HOVER_SCALE.md}
      items={categories}
      renderItem={(category) => <CategoryCardLink data={category} />}
    />
  );
}
