import { CONVERSATIONAL_INPUT_CONFIG, SearchResultsOrchestratorWrapper } from "@features/search";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
};

export default function SearchResultsPage() {
  return <SearchResultsOrchestratorWrapper placeholder={CONVERSATIONAL_INPUT_CONFIG.placeholder} />;
}
