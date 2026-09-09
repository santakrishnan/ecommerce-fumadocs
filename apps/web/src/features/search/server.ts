// Server-only public surface for the search feature.
//
// Split from index.ts because these modules import "server-only" — pulling
// them through the universal barrel would break client consumers of the
// search feature's client-safe exports.

export type { SearchRecentResponse } from "./bff/contracts/search-recent-response.schema";
export { getSearchRecent } from "./bff/use-cases/get-search-recent";
