import { QueryClient } from "@tanstack/react-query";

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
export { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, test, vi } from "vitest";
export { createLocalStorageMock } from "./local-storage-mock";
// Re-exported for backward compatibility — prefer importing `firstOf` from
// `@ucmp/vitest-config/test-utils/pure` in pure-node test files, since this
// barrel also pulls in RTL/user-event's DOM-dependent global hooks.
export { firstOf } from "./pure";

/**
 * Creates a `QueryClient` configured for tests: no retries (fail fast on
 * mocked errors) and `gcTime: 0` (no lingering cache/gc timers past the
 * test's lifetime). Use this instead of `new QueryClient(...)` in every
 * test file that needs a `QueryClientProvider`.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}
