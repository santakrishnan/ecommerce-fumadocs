import path from "node:path";
import nextjsConfig from "@ucmp/vitest-config/nextjs";
import { defineConfig, mergeConfig } from "vitest/config";

// Regex literals must live at module scope to avoid per-call allocation
// (Biome noMisplacedRegexLiteral).
const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/;
const PUBLIC_PATH_RE = /[/\\]public[/\\](.+?)(\?.*)?$/;

/**
 * Vite transform plugin for static image imports in Vitest.
 *
 * Problem: Vite inlines SVGs as `data:` URIs and resolves raster images to
 * plain string paths. Neither is a `StaticImageData` object, so any `.src`
 * access on the import returns `undefined` and `next/image` throws E451
 * ("missing required width property") when it receives a bare string src.
 *
 * Fix: intercept every image import before Vite's asset pipeline (`enforce:
 * "pre"`) and emit a synthetic ES module that matches the `StaticImageData`
 * shape `{ src, width, height }`. The `src` is derived from the file's path
 * under `public/`, producing the same root-relative URL Next.js serves.
 */
const staticImageTransform = {
  name: "vitest-static-image-transform",
  enforce: "pre" as const,
  transform(_code: string, id: string) {
    if (!IMAGE_EXT_RE.test(id)) {
      return;
    }
    const match = PUBLIC_PATH_RE.exec(id);
    const src = match?.[1] ? `/${match[1].replace(/\\/g, "/")}` : id;
    return `export default ${JSON.stringify({ src, width: 1, height: 1 })};`;
  },
};

export default defineConfig(
  mergeConfig(nextjsConfig, {
    plugins: [staticImageTransform],
    test: {
      name: "web",
      environment: "jsdom",
      globals: true,
      // e2e/** is Playwright-only (*.e2e.ts) — must stay excluded so Vitest's
      // default *.spec.ts glob never picks up a Playwright test.describe()
      // block, which throws at runtime under the wrong test runner.
      exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/e2e/**"],
      server: {
        deps: {
          // @ucmp/sdk-search-api is ESM ("type": "module") but its dist/
          // uses extension-less imports (e.g. './configure' instead of
          // './configure.js') which fail under Node's strict ESM resolver.
          // Inlining tells Vitest to process it through Vite's bundler
          // which handles extension-less imports correctly. The same applies
          // to @ucmp/sdk-visitor-profile-api and @ucmp/sdk-runtime.
          inline: [/@ucmp\/sdk-search-api/, /@ucmp\/sdk-visitor-profile-api/, /@ucmp\/sdk-runtime/],
        },
      },
      coverage: {
        provider: "v8",
        reporter: ["text", "html"],
        exclude: [
          "**/*.d.ts",
          "**/*.types.ts",
          "**/node_modules/**",
          "**/dist/**",
          "**/.next/**",
          "**/types.ts",
          "**/index.ts",
          "**/*/index.ts",
          "**/constants.ts",
          "**/config/**",
          "**/generated/**",
          "**/__mocks__/**",
          "**/fixtures/**",
          "**/*.stories.tsx",
          "**/setupTests.ts",
          "**/main.ts",
        ],
      },
    },
    server: {
      fs: {
        allow: ["../.."],
      },
    },
    resolve: {
      alias: [
        // More-specific aliases must come before the catch-all "@" alias
        { find: "@features", replacement: path.resolve(import.meta.dirname, "./src/features") },
        { find: "@shared", replacement: path.resolve(import.meta.dirname, "./src/shared") },
        { find: "@config", replacement: path.resolve(import.meta.dirname, "./src/config") },
        { find: "@layout", replacement: path.resolve(import.meta.dirname, "./src/layout") },
        {
          find: "utils",
          replacement: path.resolve(import.meta.dirname, "../../packages/utils/src"),
        },
        { find: "~", replacement: path.resolve(import.meta.dirname, "./src") },
        // "@public" must come before the catch-all "@" regex
        {
          find: /^@public\/(.*)/,
          replacement: path.resolve(import.meta.dirname, "./public/$1"),
        },
        // "@" must be last: maps "@/foo" → packages/ui/src/foo (used for shadcn imports)
        {
          find: /^@\/(.*)/,
          replacement: path.resolve(import.meta.dirname, "../../packages/ui/src/$1"),
        },
        // The Next.js `server-only` package is a runtime guard that throws on
        // client imports. Vitest doesn't ship Next's resolution shim, so map
        // it to an empty module — server/client distinctions don't matter
        // inside a unit test that explicitly invokes the function.
        {
          find: /^server-only$/,
          replacement: path.resolve(import.meta.dirname, "./src/test-shims/server-only.ts"),
        },
      ],
    },
  })
);
