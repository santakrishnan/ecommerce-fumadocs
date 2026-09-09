/**
 * Public surface of the landing feature module.
 *
 * Only re-export what other features and the route layer should consume.
 * Internal helpers, hooks, services, and mocks stay private to this folder.
 */
export { BudgetCalculatorShell } from "./components/budget-calculator-client";
export { BudgetCalculatorLoader } from "./components/budget-calculator-loader";
export { BudgetCalculatorSkeleton } from "./components/budget-calculator-skeleton";
export { CategoryCard } from "./components/category-card/category-card";
export { DealerDealSkeleton } from "./components/dealer-deal/dealer-deal-skeleton";
export { DealerDealWrapper } from "./components/dealer-deal/dealer-deal-wrapper";
export { DealerOfferCard } from "./components/dealer-offer/dealer-offer-card";
export { EditorialCardsCarousel } from "./components/editorial-cards-carousel";
export { EditorialCardsSection } from "./components/editorial-cards-section";
export { EditorialCardsSkeleton } from "./components/editorial-cards-skeleton";
export { FeaturedVehiclesSection } from "./components/featured-vehicles-section";
export { FeaturedVehiclesSkeleton } from "./components/featured-vehicles-skeleton";
export type { HeroSectionProps } from "./components/hero-section";
export { HeroSection } from "./components/hero-section";
export {
  HomeExperience,
  type HomeExperienceMode,
  HomeShell,
  WelcomeBackExperience,
} from "./components/home-experience";
export { PersonalizedSearchCarousel } from "./components/personalized-search-carousel";
export { PersonalizedSearchSection } from "./components/personalized-search-section";
export { PersonalizedSearchSkeleton } from "./components/personalized-search-skeleton";
export { RareFindsSection } from "./components/rare-finds/rare-finds-section";
export { RareFindsWrapper } from "./components/rare-finds/rare-finds-wrapper";
export { SearchOverlay, SearchPromptClient } from "./components/search-prompt";
export { SearchRecommendationsSection } from "./components/search-recommendations-section";
export { SearchRecommendationsSkeleton } from "./components/search-recommendations-skeleton";
export { ShopByCategorySection } from "./components/shop-by-category-section";
export type { EditorialCardData } from "./data/editorial-cards";
export { HERO_CONTENT } from "./data/hero-content";
export { MOCK_EXPLANATION_TEXT, MOCK_PREFERENCES } from "./data/mock-search-preferences-popover";
export type { GetPersonalizedSearchCardsOptions } from "./services/get-personalized-search-cards";
export { getPersonalizedSearchCards } from "./services/get-personalized-search-cards";
