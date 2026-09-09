/**
 * Shared Types
 *
 * Reusable TypeScript types and interfaces shared across apps and packages.
 *
 * Guidelines:
 * - Use `interface` for object shapes (extendable)
 * - Use `type` for unions, intersections, primitives
 * - Export type-only exports with `export type`
 */

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type MaybePromise<T> = T | Promise<T>;

// Service configuration types
export interface ServiceConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
}

// Provider context pattern types (React 19 style)
export interface ProviderContextValue<
  TState,
  TActions = Record<string, unknown>,
  TMeta = Record<string, unknown>,
> {
  actions: TActions;
  meta: TMeta;
  state: TState;
}

// Result type for operations that can fail
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };
