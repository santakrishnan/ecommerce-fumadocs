import type { Mock } from "vitest";
import { vi } from "vitest";
import type { AutocompleteService, Suggestion } from "../services/autocomplete-service";

// ─── Types ──────────────────────────────────────────────────

/** AutocompleteService with vi.fn() mocks for assertion support */
export interface MockAutocompleteService extends AutocompleteService {
  getSuggestions: Mock<(query: string) => Promise<Suggestion[]>>;
}

// ─── Suggestion Fixtures ────────────────────────────────────

/** Happy-path suggestions for Toyota-related queries */
export const MOCK_SUGGESTIONS: Suggestion[] = [
  { label: "2024 Toyota Camry", value: "toyota-camry-2024" },
  { label: "2024 Toyota Corolla", value: "toyota-corolla-2024" },
  { label: "2024 Honda Civic", value: "honda-civic-2024" },
];

/** Single suggestion — edge case for single-result rendering */
export const SINGLE_SUGGESTION: Suggestion[] = [
  { label: "2024 Toyota Camry", value: "toyota-camry-2024" },
];

/** Empty suggestions — simulates no results */
export const EMPTY_SUGGESTIONS: Suggestion[] = [];

// ─── Service Fixtures ───────────────────────────────────────

/** Creates a mock AutocompleteService that filters MOCK_SUGGESTIONS */
export function createMockService(
  overrides?: Partial<AutocompleteService>
): MockAutocompleteService {
  return {
    getSuggestions: vi.fn(async (query: string) => {
      const normalized = query.toLowerCase();
      return MOCK_SUGGESTIONS.filter((s) => s.label.toLowerCase().includes(normalized));
    }),
    ...overrides,
  } as MockAutocompleteService;
}

/** Creates a mock AutocompleteService that always throws (error fixture) */
export function createFailingService(): MockAutocompleteService {
  return {
    getSuggestions: vi.fn(async () => {
      throw new Error("Network error");
    }),
  } as MockAutocompleteService;
}

/** Creates a mock AutocompleteService that returns empty results */
export function createEmptyService(): MockAutocompleteService {
  return {
    getSuggestions: vi.fn(async () => EMPTY_SUGGESTIONS),
  } as MockAutocompleteService;
}

/** Creates a mock AutocompleteService with a configurable delay (loading state testing) */
export function createDelayedService(delayMs = 500): MockAutocompleteService {
  return {
    getSuggestions: vi.fn(async (query: string) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      const normalized = query.toLowerCase();
      return MOCK_SUGGESTIONS.filter((s) => s.label.toLowerCase().includes(normalized));
    }),
  } as MockAutocompleteService;
}
