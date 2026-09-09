import { createBaseConfig } from "@ucmp/vitest-config/base";
import react from "@vitejs/plugin-react";
import { defineConfig, mergeConfig, type ViteUserConfig } from "vitest/config";

/**
 * React Vitest config factory. Composes on top of `createBaseConfig` but swaps
 * the environment to jsdom and adds `@vitejs/plugin-react`. Inherits the
 * coverage/reporter/pool gating from the resolved profile.
 */
export function createReactConfig(overrides?: ViteUserConfig): ViteUserConfig {
  const config = mergeConfig(
    createBaseConfig(),
    defineConfig({
      plugins: [react()],
      test: {
        environment: "jsdom",
      },
    })
  );

  return overrides ? mergeConfig(config, overrides) : config;
}

// Backward-compatible default export.
export default createReactConfig();
