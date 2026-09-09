import { EntryStepScreen, OriginationEntryLoading } from "@features/origination";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Origination",
};

// Async leaf that resolves entry data, then renders the entry step. Suspends
// onto the <Suspense> fallback below while it awaits.
// TODO(preview): replace the artificial delay with the real entry-data fetch.
async function EntryStepLoader() {
  await new Promise((resolve) => setTimeout(resolve, 2500));
  return <EntryStepScreen />;
}

export default function OriginationPage() {
  // `/originations` is the flow's entry gate: it fetches entry data and shows
  // the entry loader (OriginationEntryLoading) while it resolves. This loader is
  // scoped to this segment only — each form step is its own route
  // (/originations/<step>) and owns its own loading UI, so refreshing mid-flow
  // does NOT re-show this entry loader.
  //
  // Sync page + async leaf in <Suspense> (PPR): the static shell streams first;
  // the entry fetch lives in the leaf and suspends onto the fallback below.
  // Route-transition loading (initial navigation) is the separate concern in
  // loading.tsx.
  return (
    <Suspense fallback={<OriginationEntryLoading />}>
      <EntryStepLoader />
    </Suspense>
  );
}
