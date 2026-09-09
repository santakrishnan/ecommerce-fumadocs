/**
 * In-memory localStorage mock for test environments.
 *
 * Usage:
 *   import { createLocalStorageMock } from "@ucmp/vitest-config/test-utils/local-storage-mock";
 *   vi.stubGlobal("localStorage", createLocalStorageMock());
 */
export function createLocalStorageMock(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) {
        delete store[k];
      }
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}
