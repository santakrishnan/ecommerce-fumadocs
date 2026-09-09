export {
  type LifetimePreferences,
  type LifetimePreferencesPatchRequest,
  lifetimePreferencesPatchSchema,
  lifetimePreferencesSchema,
  type PreferenceWeights,
  type SearchPreferences,
  type SearchPreferencesPatchRequest,
  searchPreferencesPatchSchema,
  searchPreferencesSchema,
} from "./contracts/preferences.schema";
export type { PreferencesErrorCode } from "./errors/preferences.errors";
export { type PreferencesErrorBody, preferencesErrorResponse } from "./errors/preferences.errors";
export {
  type GetLifetimePreferencesResult,
  type GetSearchPreferencesResult,
  getLifetimePreferences,
  getSearchPreferences,
  type UpdateLifetimePreferencesResult,
  type UpdateSearchPreferencesResult,
  updateLifetimePreferences,
  updateSearchPreferences,
} from "./use-cases/preferences";
