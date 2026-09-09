// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { deriveHomeMode, RECENT_RETURN_TTL_MS } from "../derive-home-mode";

const NOW = Date.parse("2026-07-08T12:00:00.000Z");

function iso(msAgo: number): string {
  return new Date(NOW - msAgo).toISOString();
}

describe("deriveHomeMode", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns first-visit when isNew", () => {
    expect(deriveHomeMode({ isNew: true, lastSeenAt: iso(0) })).toBe("first-visit");
  });

  it("returns first-visit when no lastSeenAt", () => {
    expect(deriveHomeMode({ isNew: false })).toBe("first-visit");
  });

  it("returns first-visit when lastSeenAt is unparseable", () => {
    expect(deriveHomeMode({ isNew: false, lastSeenAt: "not-a-date" })).toBe("first-visit");
  });

  it("returns recent-return just under 2h", () => {
    vi.useFakeTimers().setSystemTime(NOW);
    expect(deriveHomeMode({ isNew: false, lastSeenAt: iso(RECENT_RETURN_TTL_MS - 1000) })).toBe(
      "recent-return"
    );
  });

  it("returns lapsed-return exactly at 2h", () => {
    vi.useFakeTimers().setSystemTime(NOW);
    expect(deriveHomeMode({ isNew: false, lastSeenAt: iso(RECENT_RETURN_TTL_MS) })).toBe(
      "lapsed-return"
    );
  });

  it("returns lapsed-return beyond 2h", () => {
    vi.useFakeTimers().setSystemTime(NOW);
    expect(deriveHomeMode({ isNew: false, lastSeenAt: iso(RECENT_RETURN_TTL_MS + 60_000) })).toBe(
      "lapsed-return"
    );
  });
});
