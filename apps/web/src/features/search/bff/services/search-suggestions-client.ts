import "server-only";

import { originVerifyHeader } from "@shared/lib/http/origin-verify";
import { createServerClient } from "@shared/lib/http/server-api";

export function createSearchSuggestionsClient(baseUrl: string) {
  return createServerClient({
    baseUrl,
    defaultHeaders: originVerifyHeader(),
    headerMap: {
      sessionId: "X-Session-Id",
      tenantId: "X-Tenant-Id",
      visitorId: "X-Visitor-Id",
    },
    serviceName: "SearchSuggestions",
  });
}
