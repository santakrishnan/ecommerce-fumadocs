import "server-only";

import { PROFILE_SUGGESTIONS_FIXTURE } from "../__fixtures__/profile-suggestions.fixture";
import type { ProfileSuggestionsResponse } from "../contracts/profile-suggestions-response.schema";

const MOCK_DELAY_MS = 50;

export async function mockProfileSuggestions(): Promise<ProfileSuggestionsResponse> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return PROFILE_SUGGESTIONS_FIXTURE;
}
