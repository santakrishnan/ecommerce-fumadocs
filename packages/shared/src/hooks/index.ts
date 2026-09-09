/**
 * Shared React Hooks
 *
 * Reusable React hooks shared across apps in the monorepo.
 *
 * Guidelines:
 * - Follow React hooks naming convention (useXxx)
 * - Handle cleanup in useEffect properly
 * - Document dependencies and return types
 * - Include "use client" directive for client hooks
 */

export { useDebounce } from "./use-debounce";
export type { UseFuseSearchOptions, UseFuseSearchResult } from "./use-fuse-search";
export { useFuseSearch } from "./use-fuse-search";
export { useMediaQuery } from "./use-media-query";
