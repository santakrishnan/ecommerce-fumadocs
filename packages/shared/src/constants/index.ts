/**
 * Workspace-wide constants.
 *
 * Domain-per-file naming so the directory scales — when a new cross-cutting
 * constant domain appears (feature flags, security policies, brand metadata),
 * add `packages/shared/src/constants/<domain>.ts` and re-export here.
 */

export * from "./location";
export * from "./tracking";
