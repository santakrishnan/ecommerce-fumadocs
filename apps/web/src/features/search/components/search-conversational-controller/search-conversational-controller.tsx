"use client";

import { DEFAULT_AGENT_VERSION } from "@config/agent-backend";
import { HeroSection } from "@features/landing/components/hero-section/hero-section";
// NOTE: Direct import bypasses landing barrel to avoid "use cache" build error.
// The landing barrel re-exports server-only modules Turbopack can't tree-shake.
import { SearchPromptClient } from "@features/landing/components/search-prompt/search-prompt-client";
import {
  MOCK_PROMPT_SUGGESTIONS,
  PromptSuggestionList,
  SEARCH_HERO_CONTENT,
  SearchLoadingContent,
  searchSuggestionService,
  useIsReturningUser,
} from "@features/search";
import { useSearchConversationalContext } from "@features/search/context/search-conversational-context";
import { AGENT_SEARCH_ERROR_MESSAGE } from "@features/search/data/agent-error-copy";
import { MOCK_PROMPT_SUGGESTIONS_RETURNING } from "@features/search/data/mock-prompt-suggestions-returning";
import { getSuggestionUIConfig } from "@features/search/data/suggestion-ui-config";
import { useAgentSearchTurnsCollection } from "@features/search/hooks/use-agent-search-turns-collection";
import { useSearchLocation } from "@features/search/hooks/use-search-location";
import {
  SearchNotFoundError,
  submitAgentTurn,
} from "@features/search/services/agent-search-service";
import { devConsole } from "@shared/lib/dev-console";
import { PageGrid } from "@ucmp/ui";
import { cn } from "@ucmp/ui/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { SearchSubmitHandlerWrapper } from "./search-submit-handler-wrapper";

/**
 * SearchConversationalController — UI shell for the /search page.
 *
 * Owns focus/typing/loading UI state. On submit, fires submitAgentTurn
 * immediately from the event handler (generating both searchId and turnId),
 * then renders SearchSubmitHandlerWrapper inside SearchLoadingContent.
 * The handler watches the turn by turnId and navigates once it settles.
 *
 * SearchConversationalContext state machine:
 *   idle → focused → typing → loading → (handler navigates to /search/[id])
 */
export function SearchConversationalController({
  defaultQuery = "",
}: {
  defaultQuery?: string;
} = {}) {
  const ctx = useSearchConversationalContext();
  const collection = useAgentSearchTurnsCollection();
  const isReturningUser = useIsReturningUser();
  const router = useRouter();
  const { location } = useSearchLocation();
  const abortRef = useRef<AbortController | null>(null);
  const [pendingQuery, setPendingQuery] = useState<string>("");
  const [activeTurn, setActiveTurn] = useState<{ turnId: string; searchId: string } | null>(null);
  const [isPromptExiting, setIsPromptExiting] = useState(false);
  const [isPromptExitComplete, setIsPromptExitComplete] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const searchState = ctx?.searchConversationalState ?? "idle";
  const hasSubmittedPrompt = ctx?.hasSubmittedPrompt ?? false;
  // Select suggestion data and labels based on user type
  const suggestionsList = isReturningUser
    ? MOCK_PROMPT_SUGGESTIONS_RETURNING
    : MOCK_PROMPT_SUGGESTIONS;
  const uiConfig = getSuggestionUIConfig(isReturningUser);
  const sectionLabel = uiConfig.sectionLabel;
  const ariaLabel = uiConfig.ariaLabel;

  const handleFocusChange = (focused: boolean) => {
    if (!focused && searchState === "focused") {
      ctx?.setSearchConversationalState("idle");
    } else if (focused && searchState === "idle") {
      ctx?.setSearchConversationalState("focused");
    }
  };

  const handleValueChange = (value: string) => {
    if (value.trim().length > 0) {
      ctx?.setSearchConversationalState("typing");
    } else {
      ctx?.setSearchConversationalState("focused");
    }
  };

  const handleSubmit = (query: string) => {
    setSubmitError(null);
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const searchId = crypto.randomUUID();
    const turnId = crypto.randomUUID();

    // 1. Show loader immediately — UI responds to user action with zero delay.
    setPendingQuery(trimmed);
    setActiveTurn({ searchId, turnId });
    setIsPromptExitComplete(false);
    setIsPromptExiting(true);
    ctx?.setSearchConversationalState("loading");

    // 2. Fire the API call immediately — the loader animation plays concurrently.
    const submission = submitAgentTurn({
      agentVersion: ctx?.agentVersion ?? DEFAULT_AGENT_VERSION,
      collection,
      location,
      query: trimmed,
      searchId,
      signal: controller.signal,
      source: "query",
      turnId,
    });

    submission
      .catch((err: unknown) => {
        if (err instanceof SearchNotFoundError) {
          router.replace("/");
          return;
        }

        devConsole.error("[SearchConversationalController] submitAgentTurn failed:", err);
      })
      .finally(() => {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      });
  };

  const handleSubmitError = () => {
    setSubmitError(AGENT_SEARCH_ERROR_MESSAGE);
    setIsPromptExitComplete(false);
    setPendingQuery("");
    setActiveTurn(null);
  };

  const isPromptAreaDone = isPromptExiting || hasSubmittedPrompt || isPromptExitComplete;
  const shouldRenderPromptArea = !isPromptAreaDone;

  const handlePromptAreaExitComplete = () => {
    if (!isPromptExiting) {
      return;
    }
    setIsPromptExiting(false);
    setIsPromptExitComplete(true);
  };

  return (
    <PageGrid className={cn("pt-36 pb-24 lg:pt-30 lg:pb-6")}>
      {/*
       * Motion only tracks presence for AnimatePresence's immediate children.
       * Keep each prompt-area block as a direct keyed child so onExitComplete
       * still fires without wrapping the grid items in an extra layout box.
       */}
      <AnimatePresence mode="sync" onExitComplete={handlePromptAreaExitComplete}>
        {shouldRenderPromptArea
          ? [
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full md:col-span-6 md:col-start-2 md:max-lg:px-4 lg:col-span-6 lg:col-start-4"
                initial={{ opacity: 0, y: 90 }}
                key="prompt-hero"
                transition={{ duration: 1, ease: [0.25, 1.2, 0.75, 1] }}
              >
                <HeroSection
                  brandMarkClassName="size-9 m-1.5 md:m-2 md:size-10 text-text-primary transition-all ease-in-out animate-logo-rotate"
                  className={cn(
                    "w-full pb-0 md:pt-0 md:pb-0 lg:pt-0 lg:pb-0",
                    searchState === "typing" && "hidden lg:flex"
                  )}
                  subheadline={SEARCH_HERO_CONTENT.subheadline}
                  subheadlineClassName="max-w-none pb-0 body-xxl animate-search-page-slide-up"
                  surface="dark"
                />
              </motion.div>,
              <motion.div
                animate={{ opacity: 1 }}
                className="hidden lg:col-span-6 lg:col-start-4 lg:mt-12 lg:block lg:w-full lg:[view-transition-name:search-prompt]"
                initial={{ opacity: 0 }}
                key="prompt-desktop-input"
                transition={{ duration: 1, ease: [0.25, 1.2, 0.75, 1] }}
              >
                <SearchPromptClient
                  autocompleteService={searchSuggestionService}
                  autoFocus
                  defaultValue={defaultQuery}
                  enableSuggestions
                  error={submitError ?? undefined}
                  maxSuggestions={5}
                  onErrorDismiss={() => setSubmitError(null)}
                  onFocusChange={handleFocusChange}
                  onSubmit={handleSubmit}
                  onValueChange={handleValueChange}
                  variant="inline"
                />
              </motion.div>,
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="fixed inset-x-0 bottom-0 z-40 bg-linear-to-t from-50% from-black/90 to-transparent pt-12 pb-6 lg:hidden"
                initial={{ opacity: 0, y: 90 }}
                key="prompt-mobile-input"
                transition={{ duration: 1, ease: [0.25, 1.2, 0.75, 1] }}
              >
                <PageGrid>
                  <div className="col-span-4 md:col-span-6 md:col-start-2">
                    <SearchPromptClient
                      autocompleteService={searchSuggestionService}
                      autoFocus
                      defaultValue={defaultQuery}
                      enableSuggestions
                      error={submitError ?? undefined}
                      maxSuggestions={5}
                      onErrorDismiss={() => setSubmitError(null)}
                      onFocusChange={handleFocusChange}
                      onSubmit={handleSubmit}
                      onValueChange={handleValueChange}
                      variant="docked"
                    />
                  </div>
                </PageGrid>
              </motion.div>,
              searchState === "typing" ? null : (
                <motion.div
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="col-span-full mt-10 w-full md:col-span-6 md:col-start-2 lg:col-start-4"
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2, ease: "easeIn" } }}
                  initial={{ opacity: 0, y: 90 }}
                  key="prompt-suggestions"
                  transition={{ delay: 0.05, duration: 1, ease: [0.25, 1.2, 0.75, 1] }}
                >
                  <PromptSuggestionList
                    ariaLabel={ariaLabel}
                    sectionLabel={sectionLabel}
                    suggestions={suggestionsList.map((suggestion) => ({
                      ...suggestion,
                      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
                        e.preventDefault();
                        handleSubmit(suggestion.title);
                      },
                    }))}
                  />
                </motion.div>
              ),
            ]
          : null}
      </AnimatePresence>

      {/*
       * SearchLoadingContent only renders while context is in "loading" state.
       * SearchSubmitHandlerWrapper (ssr:false) lives here so the IDB collection
       * never touches the SSR pass. The handler receives the pending query and
       * drives the agent turn + navigation entirely from within this subtree.
       */}
      <SearchLoadingContent>
        {pendingQuery && activeTurn && isPromptExitComplete && (
          <SearchSubmitHandlerWrapper
            canNavigate={isPromptExitComplete}
            onError={handleSubmitError}
            query={pendingQuery}
            searchId={activeTurn.searchId}
            turnId={activeTurn.turnId}
          />
        )}
      </SearchLoadingContent>
    </PageGrid>
  );
}
