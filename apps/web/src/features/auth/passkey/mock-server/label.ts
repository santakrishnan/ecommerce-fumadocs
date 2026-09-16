import "server-only";

import aaguids from "./aaguids.json";

/**
 * Readable labels for a passkey. WebAuthn returns no name, so the relying
 * party builds one from the AAGUID (authenticator model) and the request
 * context at registration. This module is written so it can move into the
 * Next.js proxy route unchanged when the upstream BED takes over storage.
 *
 * `aaguids.json` is a vendored copy of the community list
 * (github.com/passkeydeveloper/passkey-authenticator-aaguids). Refresh it
 * periodically; hardware keys can additionally be resolved via FIDO MDS.
 */

const ZERO_AAGUID = "00000000-0000-0000-0000-000000000000";
const KNOWN_AAGUIDS = aaguids as Record<string, { name: string }>;

/** "iCloud Keychain", "1Password", "YubiKey 5 NFC"… or null when undisclosed/unknown. */
export function authenticatorNameFor(aaguid: string): string | null {
  if (!aaguid || aaguid === ZERO_AAGUID) {
    return null;
  }
  return KNOWN_AAGUIDS[aaguid.toLowerCase()]?.name ?? null;
}

const OS_PATTERNS: [RegExp, string][] = [
  [/iPhone/i, "iPhone"],
  [/iPad/i, "iPad"],
  [/Android/i, "Android"],
  [/Windows/i, "Windows"],
  [/Macintosh|Mac OS X/i, "macOS"],
  [/CrOS/i, "ChromeOS"],
  [/Linux/i, "Linux"],
];

const BROWSER_PATTERNS: [RegExp, string][] = [
  [/Edg\//i, "Edge"],
  [/OPR\//i, "Opera"],
  [/SamsungBrowser/i, "Samsung Internet"],
  [/Firefox\//i, "Firefox"],
  [/CriOS|Chrome\//i, "Chrome"],
  [/Safari\//i, "Safari"],
];

function firstMatch(patterns: [RegExp, string][], input: string): string | null {
  for (const [pattern, label] of patterns) {
    if (pattern.test(input)) {
      return label;
    }
  }
  return null;
}

/** "Safari on iPhone", "Chrome on Windows"… from the registering request. */
export function platformLabelFor(request: Request): string | null {
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua) {
    return null;
  }
  const os = firstMatch(OS_PATTERNS, ua);
  const browser = firstMatch(BROWSER_PATTERNS, ua);
  if (browser && os) {
    return `${browser} on ${os}`;
  }
  return browser ?? os;
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * Display rule from the approach document:
 * nickname, else "<authenticator> · <platform> · added <date>",
 * else "Passkey · added <date>".
 */
export function displayNameFor(input: {
  authenticatorName: string | null;
  createdAt: string;
  nickname: string | null;
  platformLabel: string | null;
}): string {
  if (input.nickname?.trim()) {
    return input.nickname.trim();
  }
  const added = `added ${DATE_FORMAT.format(new Date(input.createdAt))}`;
  const parts = [input.authenticatorName, input.platformLabel].filter(
    (p): p is string => typeof p === "string" && p.length > 0
  );
  return parts.length > 0 ? `${parts.join(" · ")} · ${added}` : `Passkey · ${added}`;
}
