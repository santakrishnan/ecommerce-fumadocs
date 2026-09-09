/**
 * Mock data and helpers for the preference-removal refinement flow.
 *
 * Builds the notification eyebrow ("You removed X from your preferences").
 */

// ─── Notification text builder ────────────────────────────────────────────────

export function buildPreferenceRemovalNotificationText(removedPreferences: string[]) {
  if (removedPreferences.length === 0) {
    return "";
  }

  if (removedPreferences.length === 1) {
    return `You removed ${removedPreferences[0]} from your preferences.`;
  }

  if (removedPreferences.length === 2) {
    return `You removed ${removedPreferences[0]} and ${removedPreferences[1]} from your preferences.`;
  }

  const [lastPreference] = removedPreferences.slice(-1);
  const leadingPreferences = removedPreferences.slice(0, -1).join(", ");

  return `You removed ${leadingPreferences}, and ${lastPreference} from your preferences.`;
}
