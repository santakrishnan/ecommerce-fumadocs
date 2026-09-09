/**
 * Search BFF Contracts
 *
 * Response contracts for the Search Agent feature and POST /api/v1/search.
 *
 * ─── Type-source policy ──────────────────────────────────────────────────
 * All wire-contract types are sourced from the `@ucmp/sdk-search-api` barrel
 * (never deep `dist/generated/...` paths). Zod schemas are retained purely for
 * runtime validation; their exported types alias the SDK types and their enums
 * are pinned to the SDK enum objects (e.g. `sortOrderEnum`, `filterKeyEnum`,
 * `optionCardsResponseOptionLevelEnum`) so validation stays in lockstep with the
 * API contract. This includes the divergent request/response models, which now
 * adopt the SDK type directly:
 *   • `SearchVehicle`            → SDK `InventoryCard` (search response `results`).
 *     The flat UI `Vehicle` shape is produced only at the SSR/client boundary via
 *     `lib/card-mappers/map-sdk-inventory-card-to-vehicle`; FE-only fields
 *     (surface, href, aiDescription) are derived there, not carried on the wire.
 *   • `FilterOption` / `EnumFilter` / `MultiEnumFilter` / `SmartFilter` → SDK
 *     (metadata tightened to a string-valued record to match the SDK shape).
 *
 * Intentionally LOCAL (no SDK equivalent / genuine UI concern — do NOT replace):
 *   • `SearchResultItem`            — UI card discriminated union (types/search-results.ts)
 *   • `SearchConversationalState`   — UI state machine (types/search-state.ts)
 *   • `Vehicle` (@shared/components/inventory-card) — UI render model, mapped from InventoryCard
 *   • `Suggestion` / `AutocompleteResponse` / `AutocompleteService` — no SDK autocomplete-response type
 *   • FE-only card/turn fields in `lib/agent-search-turns-collection.ts`
 *     (surface, aiDescription, badgeLabel, metrics, turn lifecycle)
 */

export type {
  AgentSearchCompleteEvent,
  AgentSearchErrorEvent,
  AgentSearchEvent,
  AgentSearchResult,
  SearchSuggestion,
  SearchSuggestionAction,
  SearchSuggestionActionType,
  SearchSuggestionImage,
  SearchSuggestionMetadata,
  SearchSuggestionsRequest,
  SearchSuggestionsResponse,
  SearchSuggestionsSection,
  SearchSuggestionsUpstreamRequest,
  SearchSuggestionsUpstreamResponse,
} from "./agent-event.schema";
export {
  searchSuggestionActionSchema,
  searchSuggestionSchema,
  searchSuggestionsRequestSchema,
  searchSuggestionsResponseSchema,
  searchSuggestionsSectionSchema,
  searchSuggestionsUpstreamRequestSchema,
  searchSuggestionsUpstreamResponseSchema,
} from "./agent-event.schema";
export type { AgentSearchRequest, AgentVersion } from "./agent-request.schema";
export { AgentSearchRequestSchema } from "./agent-request.schema";
export type { AutocompleteRequest } from "./autocomplete-request.schema";
export { autocompleteRequestSchema } from "./autocomplete-request.schema";
export type {
  AutocompleteResponse,
  AutocompleteService,
  AutocompleteSuggestion,
  Suggestion,
} from "./autocomplete-response.schema";
export { autocompleteResponseSchema } from "./autocomplete-response.schema";

export type { FiltersRequest, FiltersUpstreamRequest } from "./filters-request.schema";
export { FiltersRequestSchema } from "./filters-request.schema";
export type {
  FiltersResponse,
  FiltersUpstreamResponse,
  SelectedContextFilter,
  SmartFilter,
} from "./filters-response.schema";
export {
  selectedContextFilterSchema,
  smartFilterSchema,
} from "./filters-response.schema";
export {
  type SearchLocation,
  type SearchPagination,
  type SearchRequest,
  searchRequestSchema,
} from "./search-request.schema";
export {
  type InventoryCardResponse,
  inventoryCardResponseSchema,
  type SearchData,
  type SearchMeta,
  type SearchResultsApiResponse,
} from "./search-response.schema";
