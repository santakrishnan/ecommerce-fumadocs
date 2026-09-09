import { OriginationLoadingState } from "./origination-loading-state";

/** Initial flow loading screen (early variant), shown while flow-entry data loads. */
export function OriginationEntryLoading() {
  return (
    <OriginationLoadingState label="No hidden fees. Plus 7-day returns and a 90-day warranty." />
  );
}
