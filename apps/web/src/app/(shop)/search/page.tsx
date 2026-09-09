import { SearchConversationalController } from "@features/search";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
};

export default function SearchPage() {
  return <SearchConversationalController />;
}
