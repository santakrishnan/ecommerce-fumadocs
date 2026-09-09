import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Brand themes available to the preview toolbar — one per folder in
 * `packages/ui-theme/themes`. The app itself compiles exactly one brand
 * (`@import "@ucmp/ui-theme/themes/default"` in globals.css); the docs can
 * layer another brand's *override* files on top to check a component
 * against that brand's tokens without a second build.
 */
const THEMES_DIR = path.resolve(process.cwd(), "../../packages/ui-theme/themes");

export const DEFAULT_BRAND = "default";

/** Default brand first, the rest alphabetical. */
function compareBrands(a: string, b: string): number {
  if (a === DEFAULT_BRAND) {
    return -1;
  }
  if (b === DEFAULT_BRAND) {
    return 1;
  }
  return a.localeCompare(b);
}

export function listBrands(): string[] {
  try {
    return readdirSync(THEMES_DIR)
      .filter((entry) => statSync(path.join(THEMES_DIR, entry)).isDirectory())
      .sort(compareBrands);
  } catch {
    return [DEFAULT_BRAND];
  }
}

const IMPORT_RE = /@import\s+["']([^"']+)["']\s*;/g;
const THEME_BLOCK_RE = /@theme(?:\s+inline)?\s*\{/g;

/** Recursively inline relative `@import`s so the result is one stylesheet. */
function inlineImports(file: string, seen = new Set<string>()): string {
  if (seen.has(file)) {
    return "";
  }
  seen.add(file);
  const css = readFileSync(file, "utf8");
  return css.replace(IMPORT_RE, (_match, spec: string) => {
    if (!spec.startsWith(".")) {
      // Package imports (e.g. the base theme) are already loaded by the app.
      return "";
    }
    return inlineImports(path.resolve(path.dirname(file), spec), seen);
  });
}

/**
 * Builds plain browser CSS for a brand from its theme folder: the brand
 * overrides plus its light and dark token sets, with Tailwind's `@theme`
 * blocks rewritten to `:root` (that is what Tailwind emits for them). Applied
 * on top of the compiled default theme, later `:root` declarations win, so
 * every token the brand redefines takes effect; utilities are unchanged.
 */
export function buildBrandCss(brand: string): string | null {
  if (!listBrands().includes(brand)) {
    return null;
  }
  const dir = path.join(THEMES_DIR, brand);
  const parts = ["overrides/index.css", "light.css", "dark.css"].map((f) => path.join(dir, f));
  const css = parts
    .filter((f) => {
      try {
        return statSync(f).isFile();
      } catch {
        return false;
      }
    })
    .map((f) => inlineImports(f))
    .join("\n");
  return `/* brand: ${brand} — generated from packages/ui-theme/themes/${brand} */\n${css.replace(THEME_BLOCK_RE, ":root {")}`;
}
