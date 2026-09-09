// Vitest replaces the real `server-only` package with this empty shim
// (configured in vitest.config.ts). The real package throws when imported
// in a client context; in tests the server/client split doesn't apply.
export {};
