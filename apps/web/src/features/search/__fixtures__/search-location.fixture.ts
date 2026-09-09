import type { BedVisitorIdentity } from "@shared/lib/http/bed-client";
import type { AgentSearchLocation } from "../services/agent-search-service";

/** Shared mock visitor location (Beverly Hills) for search tests. */
export const MOCK_SEARCH_LOCATION: AgentSearchLocation = {
  zipCode: "90210",
  latitude: 34.09,
  longitude: -118.41,
};

/** Shared resolved BED visitor identity for search tests. */
export const MOCK_BED_IDENTITY: BedVisitorIdentity = {
  visitorId: "test-visitor-id",
  sessionId: "test-session-id",
};
