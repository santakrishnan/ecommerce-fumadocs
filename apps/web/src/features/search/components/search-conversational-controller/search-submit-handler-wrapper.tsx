"use client";

import dynamic from "next/dynamic";
import type { SearchSubmitHandlerProps } from "./search-submit-handler";

/**
 * Loads SearchSubmitHandler with SSR disabled.
 * useLiveQuery calls useSyncExternalStore without a server snapshot — ssr:false
 * skips the SSR pass entirely. SearchConversationalController above remains SSR-safe.
 * See: https://nextjs.org/docs/app/guides/lazy-loading#skipping-ssr
 */
export const SearchSubmitHandlerWrapper = dynamic<SearchSubmitHandlerProps>(
  () => import("./search-submit-handler").then((m) => m.SearchSubmitHandler),
  { ssr: false }
);
