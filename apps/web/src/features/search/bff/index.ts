export {
  AGENT_COMPARISON_STREAM_FIXTURE,
  AGENT_ERROR_STREAM_FIXTURE,
  AGENT_INVENTORY_STREAM_FIXTURE,
  AGENT_OPTION_CATEGORY_STREAM_FIXTURE,
  AGENT_OPTION_FALLBACK_STREAM_FIXTURE,
  AGENT_OPTION_MODEL_STREAM_FIXTURE,
  AGENT_OPTION_PACKAGE_STREAM_FIXTURE,
  AGENT_OPTION_SEGMENT_STREAM_FIXTURE,
  AGENT_OPTION_TRIM_STREAM_FIXTURE,
  SEARCH_SUGGESTIONS_ENTRY_FIXTURE,
  SEARCH_SUGGESTIONS_UPSTREAM_ENTRY_FIXTURE,
} from "./__fixtures__/agent.fixture";
export { MOCK_VEHICLE_DATASET } from "./__fixtures__/autocomplete.fixture";
export type {
  AgentSearchEvent,
  AgentSearchRequest,
  AgentSearchResult,
  AgentVersion,
} from "./contracts";
export {
  AgentSearchRequestSchema,
  type SearchSuggestion,
  type SearchSuggestionsRequest,
  type SearchSuggestionsResponse,
  searchSuggestionsRequestSchema,
  searchSuggestionsResponseSchema,
} from "./contracts";
export {
  type AutocompleteRequest,
  autocompleteRequestSchema,
} from "./contracts/autocomplete-request.schema";
export type {
  AutocompleteResponse,
  AutocompleteService,
  AutocompleteSuggestion,
  Suggestion,
} from "./contracts/autocomplete-response.schema";
export { autocompleteResponseSchema } from "./contracts/autocomplete-response.schema";
export type { FiltersRequest } from "./contracts/filters-request.schema";
export { FiltersRequestSchema } from "./contracts/filters-request.schema";
export type {
  FiltersResponse,
  FiltersUpstreamResponse,
  SelectedContextFilter,
  SmartFilter,
} from "./contracts/filters-response.schema";
export {
  selectedContextFilterSchema,
  smartFilterSchema,
} from "./contracts/filters-response.schema";
export {
  type SearchRecentRequest,
  searchRecentRequestSchema,
} from "./contracts/search-recent-request.schema";
export {
  type SearchRecentResponse,
  searchRecentResponseSchema,
} from "./contracts/search-recent-response.schema";
export {
  type SearchLocation,
  type SearchPagination,
  type SearchRequest,
  searchRequestSchema,
} from "./contracts/search-request.schema";
export type {
  SearchData,
  SearchMeta,
  SearchResultsApiResponse,
} from "./contracts/search-response.schema";
export type { AgentError, AgentErrorCode } from "./errors/agent.errors";
export { AgentErrorCodes, createAgentError, mapCaughtToAgentError } from "./errors/agent.errors";
export { agentErrorSseFrame, agentPreStreamErrorResponse } from "./errors/agent-error-response";
export type { AutocompleteErrorCode } from "./errors/autocomplete.errors";
export type { AutocompleteErrorBody } from "./errors/autocomplete-error-response";
export { autocompleteErrorResponse } from "./errors/autocomplete-error-response";
export type { FiltersErrorCode } from "./errors/filters.errors";
export type { FiltersErrorBody } from "./errors/filters-error-response";
export { filtersErrorResponse } from "./errors/filters-error-response";
export type { SearchErrorCode } from "./errors/search.errors";
export { type SearchErrorBody, searchErrorResponse } from "./errors/search-error-response";
export type { SearchRecentErrorCode } from "./errors/search-recent.errors";
export {
  type SearchRecentErrorBody,
  searchRecentErrorResponse,
} from "./errors/search-recent-error-response";
export type { SearchSuggestionsErrorCode } from "./errors/search-suggestions.errors";
export {
  type SearchSuggestionsErrorBody,
  searchSuggestionsErrorResponse,
} from "./errors/search-suggestions-error-response";
export { resolveAgentBackend } from "./lib/resolve-agent-backend";
export { resolveInitialAgentVersion } from "./lib/resolve-initial-agent-version";
export { mapAgentUpstreamEvent } from "./mappers/agent.mapper";
export { mapInventoryCardResponseToVehicle } from "./mappers/search.mapper";
export { mapSearchSuggestionsUpstreamToResponse } from "./mappers/search-suggestions.mapper";
export { mockSearchAgentStream } from "./services/agent-mock";
export { fetchAgentStream } from "./services/agent-upstream";
export { mockSearchSuggestions } from "./services/search-suggestions-mock";
export { fetchSearchSuggestionsCached } from "./services/search-suggestions-upstream";
export type { GetAutocompleteResult } from "./use-cases/get-autocomplete";
export { getAutocomplete } from "./use-cases/get-autocomplete";
export type { GetFiltersResult } from "./use-cases/get-filters";
export { getFilters } from "./use-cases/get-filters";
export { getSearchAgentStream } from "./use-cases/get-search-agent-stream";
export {
  type GetSearchRecentResult,
  getSearchRecent,
} from "./use-cases/get-search-recent";
export type { GetSearchResultsResult } from "./use-cases/get-search-results";
export { getSearchResults } from "./use-cases/get-search-results";
export {
  type GetSearchSuggestionsResult,
  getSearchSuggestions,
} from "./use-cases/get-search-suggestions";
