import path from "node:path";
import reactConfig from "@ucmp/vitest-config/react";
import { defineConfig, mergeConfig } from "vitest/config";

export default defineConfig(
  mergeConfig(reactConfig, {
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    test: {
      name: "ui",
      environment: "jsdom",
      setupFiles: ["./vitest.setup.ts"],
    },
  })
);
