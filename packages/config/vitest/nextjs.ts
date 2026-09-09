import path from "node:path";
import { fileURLToPath } from "node:url";
import { createBaseConfig } from "@ucmp/vitest-config/base";
import react from "@vitejs/plugin-react";
import { defineConfig, mergeConfig, type ViteUserConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Use absolute path to ensure it works regardless of where vitest is executed from
const setupPath = path.resolve(__dirname, "./test-utils/nextjs-setup.ts");

/**
 * Next.js Vitest config factory. Composes on top of `createBaseConfig`
 * (inherits profile gating) with jsdom + `@vitejs/plugin-react` and the
 * absolute-path `nextjs-setup.ts` setup file for `apps/web`.
 */
export function createNextjsConfig(overrides?: ViteUserConfig): ViteUserConfig {
  const config = mergeConfig(
    createBaseConfig(),
    defineConfig({
      plugins: [
        react({
          // Ensure React plugin can handle the setup file
          include: "**/*.{jsx,tsx,ts,js}",
        }),
      ],
      test: {
        environment: "jsdom",
        setupFiles: [setupPath],
      },
    })
  );

  return overrides ? mergeConfig(config, overrides) : config;
}

// Backward-compatible default export.
export default createNextjsConfig();
