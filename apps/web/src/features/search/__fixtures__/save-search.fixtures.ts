/**
 * Test fixtures for Save Search feature
 */

export const TEST_SESSION_ID = "test-session-123";

export const MOCK_SAVED_RECORD = {
  isSaved: true,
  savedAt: Date.now(),
  sessionId: TEST_SESSION_ID,
} as const;

export const MOCK_UNSAVED_RECORD = {
  isSaved: false,
  savedAt: Date.now(),
  sessionId: TEST_SESSION_ID,
} as const;
