// Public API for the search feature

export { MOCK_VEHICLE_DATASET } from "./bff/__fixtures__/autocomplete.fixture";
export {
  generateInventoryCardFixtures,
  generateVehicleFixtures,
  INVENTORY_CARD_FIXTURES,
  VEHICLE_FIXTURES,
} from "./bff/__fixtures__/vehicle-results.fixture";
export type { AutocompleteService, Suggestion } from "./bff/contracts/autocomplete-response.schema";
export { mockAutocompleteService } from "./bff/services/autocomplete-mock";
export type { PaginatedData } from "./bff/services/search-results-service";
export { ConversationalSearchBackdrop } from "./components/conversational-search-backdrop";
export type { ConversationalThreadProps } from "./components/conversational-thread";
export { ConversationalThread } from "./components/conversational-thread";
export type { FilterSection } from "./components/filters-dialog";
export { FILTER_SECTIONS } from "./components/filters-dialog";
export type { IntentBannerAction, IntentBannerProps } from "./components/intent-banner";
export { IntentBanner } from "./components/intent-banner";
export type {
  PromptSuggestionCardProps,
  PromptSuggestionListProps,
} from "./components/prompt-suggestion-card";
export { PromptSuggestionCard, PromptSuggestionList } from "./components/prompt-suggestion-card";
export {
  SaveSearchController,
  SaveSearchToggle,
  SEARCH_TOGGLE_COPY,
} from "./components/save-search";
export { SearchExitGuard } from "./components/search-back-navigation-guard";
export { SearchConversationalController } from "./components/search-conversational-controller";
export { SearchHeader } from "./components/search-header";
export { SearchLoadingContent } from "./components/search-loading-content";
export { SearchLoadingIndicator } from "./components/search-loading-indicator";
export { SearchNavContextualContent } from "./components/search-nav-contextual-content";
export type {
  SearchResultsOrchestratorProps,
  TurnProvider,
} from "./components/search-results-orchestrator";
export {
  SearchResultsOrchestrator,
  SearchResultsOrchestratorWrapper,
} from "./components/search-results-orchestrator";
export type { SearchResultsPageProps } from "./components/search-results-page";
export { SearchResultsPage } from "./components/search-results-page";
export { SearchResultsReadyGuard } from "./components/search-results-ready-guard";
export type { SearchConversationalProps } from "./context/search-conversational-context";
export {
  SearchConversationalProvider,
  useSearchConversationalContext,
} from "./context/search-conversational-context";
export { CONVERSATIONAL_INPUT_CONFIG } from "./data/conversational-input-config";
export {
  mockIntentBannerComplete,
  mockIntentBannerLoading,
  mockIntentBannerNoAction,
} from "./data/mock-intent-banner";
export { MOCK_PROMPT_SUGGESTIONS } from "./data/mock-prompt-suggestions";
export { MOCK_PROMPT_SUGGESTIONS_RETURNING } from "./data/mock-prompt-suggestions-returning";
export { MOCK_SEARCH_RESULTS_HEADLINE } from "./data/mock-search-results";
export { SEARCH_HERO_CONTENT } from "./data/search-hero-content";
export { SEARCH_SUGGESTION_TRIGGERS } from "./data/suggestion-triggers";
export {
  getSuggestionUIConfig,
  NEW_USER_UI_CONFIG,
  RETURNING_USER_UI_CONFIG,
  type SuggestionUIConfig,
} from "./data/suggestion-ui-config";
export type { UseAgentSearchTurnsResult } from "./hooks/use-agent-search-turns";
export type { SubmitTurnOptions } from "./hooks/use-ephemeral-agent-search-turns";
export { useIsReturningUser } from "./hooks/use-is-returning-user";
export { useSearchSuggestions } from "./hooks/use-search-suggestions";
export {
  type AgentSearchResponse,
  type AgentSearchTurn,
  type AgentSearchTurnsCollection,
  type ComparisonCard as AgentComparisonCard,
  getAgentSearchTurnsCollection,
  type InventoryCard as AgentInventoryCard,
  type NextSearchPlan,
  type OptionCard as AgentOptionCard,
} from "./lib/agent-search-turns-collection";
export { type InferredGridVariant, inferGridVariant } from "./lib/infer-grid-variant";
export { createResultCardRenderer } from "./lib/render-result-card";
export { SearchProviders } from "./providers";
export { apiAutocompleteService } from "./services/api-autocomplete-service";
export { fixtureSearchResultsSource } from "./services/fixture-search-results-source";
export { getSearchResultsSource } from "./services/get-search-results-source";
export type {
  SearchResultsParams,
  SearchResultsResponse,
  SearchResultsSource,
} from "./services/search-results-source";
export { searchSuggestionService } from "./services/search-suggestion-service";
export type { SearchResultItem } from "./types/search-results";
export type { SearchAgentMode } from "./types/search-state";
