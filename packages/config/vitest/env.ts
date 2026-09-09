/**
 * Test environment resolver — single source of truth that maps the process
 * environment to a normalised test profile. Keeps env-detection logic out of
 * the individual Vitest config factories so cache keys stay deterministic.
 *
 * See `.kiro/specs/local-test-suite-speed/design.md` for the full contract.
 */

export type TestMode = "local" | "ci";

export interface TestEnv {
  /** Whether coverage instrumentation should run. */
  coverageEnabled: boolean;
  /** Coverage reporters (only meaningful when coverageEnabled). */
  coverageReporters: string[];
  /** Whether per-file isolation is enabled. */
  isolate: boolean;
  /** "ci" when CI env var is truthy, otherwise "local". Overridable via VITEST_MODE. */
  mode: TestMode;
  /** Worker pool selection. */
  pool: "forks" | "threads";
  /** Reporters passed to Vitest for this run. */
  reporters: string[];
}

/** Truthy check for env flags — treats "0"/"false"/"" as false. */
function isTruthy(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  const normalised = value.trim().toLowerCase();
  return normalised !== "" && normalised !== "0" && normalised !== "false";
}

/**
 * Resolve the active test profile from the process environment.
 *
 * Pure and deterministic: the same `env` in always yields the same `TestEnv`
 * out (required for stable Turborepo cache keys). Does not mutate `env`.
 */
export function resolveTestEnv(env: NodeJS.ProcessEnv = process.env): TestEnv {
  // Step 1: determine mode. Explicit VITEST_MODE wins, then CI auto-detection.
  let mode: TestMode;
  if (env.VITEST_MODE === "ci" || env.VITEST_MODE === "local") {
    mode = env.VITEST_MODE;
  } else if (isTruthy(env.CI)) {
    mode = "ci";
  } else {
    mode = "local";
  }

  // Step 2: coverage + reporter decision.
  let coverageEnabled: boolean;
  let coverageReporters: string[];
  let reporters: string[];

  if (mode === "ci") {
    coverageEnabled = true;
    coverageReporters = ["text", "json", "html", "lcov"];
    reporters = ["default"];
  } else {
    coverageEnabled = isTruthy(env.VITEST_COVERAGE);
    coverageReporters = coverageEnabled ? ["text"] : [];
    reporters = ["dot"];
  }

  // Step 3: pool + isolation.
  // Local uses "threads" (worker_threads) — far cheaper to spawn than "forks"
  // (full child processes), which is especially impactful on Windows where
  // process creation is expensive. CI keeps "forks" for maximum isolation and
  // byte-for-byte parity with the historical pipeline. `isolate` stays true
  // everywhere: relaxing it reuses the module graph/jsdom across files and
  // causes cross-test state bleed (measured: ~89 false failures).
  const pool = mode === "ci" ? "forks" : "threads";
  const isolate = true;

  return {
    mode,
    coverageEnabled,
    reporters,
    coverageReporters,
    pool,
    isolate,
  };
}
