import { SEARCH_HERO_CONTENT } from "@features/search/data/search-hero-content";
import type { HeroSectionProps } from "../components/hero-section";
import { HERO_CONTENT } from "../data/hero-content";

/** Fixture type with required headline and subheadline for tests that assert on them. */
type HeroFixture = HeroSectionProps & Required<Pick<HeroSectionProps, "headline" | "subheadline">>;

/** Happy-path fixture — mirrors production usage from constants. */
export const heroDefaultProps: HeroFixture = {
  ...HERO_CONTENT,
};

/** Fixture type for search page — has subheadline but no headline. */
type HeroSearchFixture = HeroSectionProps & Required<Pick<HeroSectionProps, "subheadline">>;

/** Search page fixture — mirrors search-conversational-controller production usage. */
export const heroSearchProps: HeroSearchFixture = {
  brandMarkClassName:
    "size-9 m-1.5 md:m-2 md:size-10 text-text-primary transition-all ease-in-out animate-logo-rotate",
  className: "max-w-2xl pb-0 md:pt-0 md:pb-0 lg:pt-0 lg:pb-0",
  subheadline: SEARCH_HERO_CONTENT.subheadline,
  subheadlineClassName: "max-w-none pb-0 body-xxl animate-search-page-slide-up",
  surface: "dark",
};
