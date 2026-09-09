import type { SearchLoadingBeat } from "../components/search-loading-indicator";

export const searchLoadingIndicatorThinkingStatusFixture = "Working on your search...";

export const searchLoadingIndicatorBeatsFixture: SearchLoadingBeat[] = [
  { beat: "vehicles", message: "Finding vehicles", status: "done" },
  { beat: "matches", message: "Matching your preferences", status: "active" },
];
