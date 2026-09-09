const MOCK_NOT_FOUND_SEARCH_IDS = new Set([
  "expired-search-id",
  "00000000-0000-4000-8000-000000000404",
  "invalid-search-id",
  "00000000-0000-4000-8000-0000000invalid",
]);

export function isMockNotFoundSearchId(searchId: string): boolean {
  return MOCK_NOT_FOUND_SEARCH_IDS.has(searchId.toLowerCase());
}
