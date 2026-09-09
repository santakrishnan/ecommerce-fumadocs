// Reads process.env directly — see ADR-0011 §7 (Documented exceptions).
// This module is re-exported via search/index.ts and reaches Client Components;
// importing env.ts would pull server-only into the client bundle.
const JITTER_MIN_FACTOR = 0.5;
const JITTER_RANGE_FACTOR = 5;

function isMockLatencyEnabled(): boolean {
  return process.env.MOCK_LATENCY === "true";
}

function jitteredDelay(baseMs: number): number {
  return baseMs * (JITTER_MIN_FACTOR + Math.random() * JITTER_RANGE_FACTOR);
}

function mockDelay(baseMs: number): Promise<void> {
  if (!isMockLatencyEnabled()) {
    return Promise.resolve();
  }

  return new Promise((resolve) => setTimeout(resolve, jitteredDelay(baseMs)));
}

export { mockDelay };
