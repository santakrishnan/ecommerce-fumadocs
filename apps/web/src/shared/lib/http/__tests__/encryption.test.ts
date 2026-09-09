// @vitest-environment node
import * as jose from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";
import { decryptPayload, encryptPayload, resolveEncryptionKey } from "../encryption";

function generateBase64urlKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return jose.base64url.encode(bytes);
}

describe("encryption", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("round-trips a JSON-shaped payload", async () => {
    vi.stubEnv("ENCRYPTION_KEY", generateBase64urlKey());
    const key = resolveEncryptionKey();
    expect(key).not.toBeNull();
    if (!key) {
      return;
    }
    const payload = { user: "x", action: "login", at: Date.now() };
    const jwe = await encryptPayload(payload, key);
    const decoded = await decryptPayload<typeof payload>(jwe, key);
    expect(decoded).toEqual(payload);
  });

  it("returns null when no key is configured", () => {
    vi.stubEnv("ENCRYPTION_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_ENCRYPTION_KEY", "");
    expect(resolveEncryptionKey()).toBeNull();
  });
});
