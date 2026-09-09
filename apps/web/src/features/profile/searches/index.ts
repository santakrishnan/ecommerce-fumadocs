export {
  type GetSearchesResult,
  getSearches,
  type SearchesErrorBody,
  type SearchesErrorCode,
  type SearchSession,
  searchesErrorResponse,
  searchSessionSchema,
  type UpdateSearchRequest,
  type UpdateSearchResult,
  updateSearch,
  updateSearchRequestSchema,
} from "./bff";

export { fetchSearchesClient, updateSearchClient } from "./bff/services/searches-client";
