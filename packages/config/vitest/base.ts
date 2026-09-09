import { resolveTestEnv } from "@ucmp/vitest-config/env";
import { defineConfig, mergeConfig, type ViteUserConfig } from "vitest/config";

/** Standard coverage excludes shared across every profile. */
const STANDARD_EXCLUDES = [
  "node_modules/",
  "src/test/",
  "**/*.config.*",
  "**/*.d.ts",
  ".next/",
  "dist/",
  "build/",
];

/**
 * Base Vitest config factory. Node environment (no jsdom), tuned per the
 * resolved test profile (local = coverage-free + dot reporter, ci = full
 * coverage + all reporters). Node-only packages (`utils`, `shared` non-DOM)
 * consume this directly so they never pay the jsdom tax.
 */
export function createBaseConfig(overrides?: ViteUserConfig): ViteUserConfig {
  const te = resolveTestEnv();

  const config = defineConfig({
    test: {
      globals: true,
      environment: "node",
      include: ["**/*.{test,spec}.{ts,tsx}"],
      // Cold ESM transforms of heavy dependency graphs (e.g. the inlined
      // search SDK or a feature BFF) can take ~7s on the first `await import()`
      // inside a test. The Vitest default (5s) leaves these first-in-file
      // tests flaky under machine load. A higher ceiling absorbs cold-start
      // cost while still catching genuinely hung tests.
      testTimeout: 20_000,
      hookTimeout: 20_000,
      pool: te.pool,
      isolate: te.isolate,
      reporters: te.reporters,
      coverage: te.coverageEnabled
        ? {
            enabled: true,
            provider: "v8",
            reporter: te.coverageReporters,
            exclude: STANDARD_EXCLUDES,
          }
        : { enabled: false },
    },
  });

  return overrides ? mergeConfig(config, overrides) : config;
}

// Backward-compatible default export so existing
// `import baseConfig from "@ucmp/vitest-config/base"` keeps working.
export default createBaseConfig();
