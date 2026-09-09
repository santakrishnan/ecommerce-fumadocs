import "server-only";

import { configureSearchApiClient } from "@ucmp/sdk-search-api";

export { searchInventory as search } from "@ucmp/sdk-search-api";

let configured = false;
let configuredBaseUrl: string | undefined;
let configuredApiKey: string | undefined;

/**
 * Ensures the SDK client is configured exactly once per process lifecycle.
 * Reads base URL and API key from caller (sourced from env vars upstream).
 */
export function ensureSearchClientConfigured(baseUrl: string, apiKey: string) {
  if (configured) {
    if (configuredBaseUrl !== baseUrl || configuredApiKey !== apiKey) {
      throw new Error("Search API client is already configured with different credentials");
    }
    return;
  }

  configureSearchApiClient({
    baseUrl,
    headers: { "x-api-key": apiKey },
  });

  configuredBaseUrl = baseUrl;
  configuredApiKey = apiKey;
  configured = true;
}
