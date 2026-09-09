// @vitest-environment node
import { describe, expect, it } from "vitest";
import { sha256Hex } from "../hash";

const HEX_64_REGEX = /^[0-9a-f]{64}$/;

describe("sha256Hex", () => {
  it("matches known SHA-256 vectors", async () => {
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
    expect(await sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
  });

  it("returns a 64-char lowercase hex string", async () => {
    const digest = await sha256Hex("visitor-abc-123");
    expect(digest).toMatch(HEX_64_REGEX);
  });

  it("is deterministic for the same input", async () => {
    const input = "fp-device-fingerprint";
    expect(await sha256Hex(input)).toBe(await sha256Hex(input));
  });

  it("produces different digests for different inputs", async () => {
    expect(await sha256Hex("visitor-a")).not.toBe(await sha256Hex("visitor-b"));
  });

  it("handles multi-byte UTF-8 input", async () => {
    expect(await sha256Hex("café-☕")).toMatch(HEX_64_REGEX);
  });
});
