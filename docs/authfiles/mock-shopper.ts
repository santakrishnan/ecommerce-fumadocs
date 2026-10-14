import "server-only";

/**
 * The single mock shopper used by the passkey mocks. MOCKS ONLY.
 *
 * WebAuthn needs one stable user handle per account, so we mint a random handle
 * lazily and reuse it for the process lifetime (a throwaway value, reset on
 * restart). The real flow takes the handle from VPS/EDI.
 */

export interface MockShopperHandle {
  userDisplayName: string;
  userHandle: string;
  /** Same handle as raw bytes, for `generateRegistrationOptions({ userID })`. */
  userId: Uint8Array<ArrayBuffer>;
  userName: string;
}

// Mirrors the T2/T3 demo fixture shopper (profile-resolve-auth.fixture.ts).
const MOCK_SHOPPER_DISPLAY_NAME = "Alex Rivera";
const MOCK_SHOPPER_USER_NAME = "alex.rivera@example.com";

/** WebAuthn recommends a 64-byte user handle. */
const USER_HANDLE_BYTES = 64;

const BASE64_PADDING = /=+$/;
const BASE64_PLUS = /\+/g;
const BASE64_SLASH = /\//g;

let cachedHandle: Uint8Array<ArrayBuffer> | undefined;

/** Fill a fresh, explicitly `ArrayBuffer`-backed buffer with random bytes. */
function randomUserId(): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(USER_HANDLE_BYTES));
  crypto.getRandomValues(bytes);
  return bytes;
}

/** Encode raw bytes to a base64url string (no padding), browser-safe. */
function toBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(BASE64_PADDING, "")
    .replace(BASE64_PLUS, "-")
    .replace(BASE64_SLASH, "_");
}

/**
 * Return the mock shopper's stable identity, minting the random handle on first
 * use. `shopperLabel` can override the display name for presentation only.
 */
export function getMockShopperHandle(shopperLabel?: string): MockShopperHandle {
  if (!cachedHandle) {
    cachedHandle = randomUserId();
  }
  return {
    userId: cachedHandle,
    userHandle: toBase64url(cachedHandle),
    userName: MOCK_SHOPPER_USER_NAME,
    userDisplayName: shopperLabel?.trim() || MOCK_SHOPPER_DISPLAY_NAME,
  };
}

/** Test-only: forget the cached handle so cases start from a clean slate. */
export function __resetMockShopperHandle(): void {
  cachedHandle = undefined;
}
