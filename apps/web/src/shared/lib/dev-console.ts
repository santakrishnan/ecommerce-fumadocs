/**
 * Dev-only console wrapper.
 *
 * All methods are silent in production (`NODE_ENV === "production"`).
 * In development they delegate to the native `console` methods unchanged.
 *
 * Use this instead of bare `console.log/warn/error` in client code, components,
 * hooks, and services to keep production bundles free of user-visible console noise.
 *
 * The existing `shared/lib/logger.ts` (structured, server-only) is NOT replaced
 * by this utility — they serve different purposes.
 *
 * @example
 * ```ts
 * import { devConsole } from "@shared/lib/dev-console";
 * devConsole.error("[MyComponent] something failed", err);
 * ```
 */

const isDev = process.env.NODE_ENV !== "production";

function log(...args: unknown[]): void {
  if (isDev) {
    console.log(...args);
  }
}

function warn(...args: unknown[]): void {
  if (isDev) {
    console.warn(...args);
  }
}

function error(...args: unknown[]): void {
  if (isDev) {
    console.error(...args);
  }
}

function info(...args: unknown[]): void {
  if (isDev) {
    console.info(...args);
  }
}

export const devConsole = { log, warn, error, info } as const;
