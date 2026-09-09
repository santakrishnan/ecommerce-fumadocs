const JITTER_MIN_FACTOR = 0.5;
const JITTER_RANGE_FACTOR = 5;

function isMockLatencyEnabled(): boolean {
  return process.env.MOCK_LATENCY === "true";
}

function jitteredDelay(baseMs: number): number {
  return baseMs * (JITTER_MIN_FACTOR + Math.random() * JITTER_RANGE_FACTOR);
}

/**
 * Resolve after a jittered delay when `MOCK_LATENCY=true`, otherwise resolve
 * immediately. Origination mock services await this to surface loading states
 * in development without slowing down tests or production fallbacks.
 *
 * Mirrors the search BFF `mockDelay` helper so the whole monorepo shares one
 * latency-simulation convention.
 */
function mockDelay(baseMs: number): Promise<void> {
  if (!isMockLatencyEnabled()) {
    return Promise.resolve();
  }

  return new Promise((resolve) => setTimeout(resolve, jitteredDelay(baseMs)));
}

export { mockDelay };
