/**
 * Keyword-based suggestion triggers.
 * Each entry maps a keyword to related search suggestions.
 * Each suggestion has a unique `id` to avoid React key conflicts.
 */

import type { Suggestion } from "@features/search/bff/contracts/autocomplete-response.schema";

export interface SuggestionTrigger {
  keyword: string;
  suggestions: Suggestion[];
}

export const SEARCH_SUGGESTION_TRIGGERS: SuggestionTrigger[] = [
  {
    keyword: "spacious",
    suggestions: [
      { label: "Third row seating", value: "spacious-1" },
      { label: "Extra cargo capacity", value: "spacious-2" },
      { label: "8 passengers", value: "spacious-3" },
      { label: "All Vans", value: "spacious-4" },
    ],
  },
  {
    keyword: "towing",
    suggestions: [
      { label: "Tow package", value: "towing-1" },
      { label: "Heavy duty towing", value: "towing-2" },
      { label: "Truck with towing", value: "towing-3" },
      { label: "SUV with towing", value: "towing-4" },
    ],
  },
  {
    keyword: "safety",
    suggestions: [
      { label: "Blind spot monitor", value: "safety-1" },
      { label: "Pre-collision system", value: "safety-2" },
      { label: "Adaptive cruise control", value: "safety-3" },
      { label: "Lane departure alert", value: "safety-4" },
      { label: "360 camera", value: "safety-5" },
    ],
  },
  {
    keyword: "comfort",
    suggestions: [
      { label: "Leather seats", value: "comfort-1" },
      { label: "Heated front seats", value: "comfort-2" },
      { label: "Ventilated seats", value: "comfort-3" },
      { label: "Dual climate control", value: "comfort-4" },
      { label: "Panoramic moonroof", value: "comfort-5" },
    ],
  },
  {
    keyword: "tech",
    suggestions: [
      { label: "Apple CarPlay", value: "tech-1" },
      { label: "Wireless charging", value: "tech-2" },
      { label: "Head-up display", value: "tech-3" },
      { label: "Premium audio", value: "tech-4" },
      { label: "Navigation system", value: "tech-5" },
    ],
  },
  {
    keyword: "fuel",
    suggestions: [
      { label: "Fuel efficient SUVs", value: "fuel-1" },
      { label: "Fuel efficient under $30k", value: "fuel-2" },
      { label: "Fuel efficient hybrid", value: "fuel-3" },
      { label: "Fuel efficient automatic", value: "fuel-4" },
      { label: "Fuel efficient 2024", value: "fuel-5" },
    ],
  },
  {
    keyword: "electric",
    suggestions: [
      { label: "Electric vehicles", value: "electric-1" },
      { label: "Electric SUVs", value: "electric-2" },
      { label: "Electric sedans", value: "electric-3" },
      { label: "Electric trucks", value: "electric-4" },
      { label: "Electric under $40k", value: "electric-5" },
    ],
  },
  {
    keyword: "luxury",
    suggestions: [
      { label: "Luxury SUVs", value: "luxury-1" },
      { label: "Luxury sedans", value: "luxury-2" },
      { label: "Luxury sports cars", value: "luxury-3" },
      { label: "Luxury under $50k", value: "luxury-4" },
      { label: "Luxury hybrid", value: "luxury-5" },
    ],
  },
  {
    keyword: "family",
    suggestions: [
      { label: "Family vehicles", value: "family-1" },
      { label: "Family SUVs", value: "family-2" },
      { label: "Family minivans", value: "family-3" },
      { label: "Family sedans", value: "family-4" },
      { label: "Family crossovers", value: "family-5" },
    ],
  },
  {
    keyword: "truck",
    suggestions: [
      { label: "Off-road capable trucks", value: "truck-1" },
      { label: "Pickup trucks", value: "truck-2" },
      { label: "Heavy duty trucks", value: "truck-3" },
      { label: "Truck under $40k", value: "truck-4" },
      { label: "Truck with towing", value: "truck-5" },
    ],
  },
  {
    keyword: "suv",
    suggestions: [
      { label: "Compact luxury SUVs", value: "suv-1" },
      { label: "Electric SUVs under $40k", value: "suv-2" },
      { label: "Family SUVs with 3 rows", value: "suv-3" },
      { label: "Fuel efficient hybrid SUVs", value: "suv-4" },
      { label: "Off-road capable SUVs", value: "suv-5" },
    ],
  },
  {
    keyword: "hybrid",
    suggestions: [
      { label: "Fuel efficient hybrid", value: "hybrid-1" },
      { label: "Luxury hybrid", value: "hybrid-2" },
      { label: "Hybrid SUVs", value: "hybrid-3" },
      { label: "Hybrid sedans", value: "hybrid-4" },
      { label: "Hybrid under $30k", value: "hybrid-5" },
    ],
  },
  {
    keyword: "sedan",
    suggestions: [
      { label: "Best fuel economy sedans", value: "sedan-1" },
      { label: "Luxury sedans", value: "sedan-2" },
      { label: "Compact sedans", value: "sedan-3" },
      { label: "Sedan under $25k", value: "sedan-4" },
      { label: "Sedan with AWD", value: "sedan-5" },
    ],
  },
  {
    keyword: "cargo",
    suggestions: [
      { label: "Extra cargo capacity", value: "cargo-1" },
      { label: "Cargo space over 70 cu ft", value: "cargo-2" },
      { label: "Flat-folding rear seats", value: "cargo-3" },
      { label: "Power liftgate", value: "cargo-4" },
    ],
  },
  {
    keyword: "passenger",
    suggestions: [
      { label: "7 passengers", value: "passenger-1" },
      { label: "8 passengers", value: "passenger-2" },
      { label: "Third row seating", value: "passenger-3" },
      { label: "Captain chairs", value: "passenger-4" },
    ],
  },
  {
    keyword: "off-road",
    suggestions: [
      { label: "Off-road capable SUVs", value: "offroad-1" },
      { label: "4WD trucks", value: "offroad-2" },
      { label: "Skid plates and crawl control", value: "offroad-3" },
      { label: "All-terrain tires", value: "offroad-4" },
    ],
  },
];
