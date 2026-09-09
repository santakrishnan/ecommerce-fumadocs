# Storybook Conventions

## Running Storybook

```bash
# Development server (http://localhost:6006)
pnpm storybook

# Static build
pnpm build-storybook
```

## Story File Placement

Stories live in a `__stories__/` directory co-located with the component source:

```
packages/ui/src/components/
├── button.tsx
├── __stories__/
│   ├── button.stories.tsx
│   └── button.mdx
```

## Naming Convention

Story files use kebab-case matching the component file name:

```
component-name.stories.tsx
```

All stories are written in TypeScript (`.stories.tsx`, not `.stories.js`).

## CSF3 Format

All stories must use Component Story Format 3 (CSF3) with object syntax:

```tsx
import type { Meta, StoryObj } from "@storybook/react"

import { MyComponent } from "@/components/my-component"

const meta = {
  title: "Components/MyComponent",
  component: MyComponent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    // shared default args
  },
} satisfies Meta<typeof MyComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variant: Story = {
  args: { variant: "secondary" },
}
```

### Rules

- Use `satisfies Meta<typeof Component>` for the meta object.
- Type stories as `StoryObj<typeof meta>`.
- Include `tags: ['autodocs']` in meta to enable auto-generated documentation.
- Set shared props in meta-level `args` — individual stories only override what changes.
- Do **not** use CSF2 template binding patterns.
- Do **not** use `useState` or `useEffect` in story render functions.

## Toolbar Controls

### Brand (theme switcher)

The **Brand** toolbar control switches between white-label themes. It is powered by `@storybook/addon-themes` wired into `next-themes` via the `withNextThemes` decorator (`.storybook/with-next-themes.tsx`).

| Option | What it does |
| --- | --- |
| Default | Toyota brand (Toyota Type font, black primary, generous radii) |
| Acme | Acme brand (system-ui font, violet primary, geometric radii) |

The brand selection persists across story navigation within a session (standard Storybook globals behavior). No page reload is required — the change is reactive.

**How it works:** The `withNextThemes` decorator syncs the toolbar selection into `next-themes` via `setTheme()` (writing `<html data-theme="...">`) and enables the active brand's compiled stylesheet. Each non-default brand ships as a thin entry file (`.storybook/brand-<brand>.css`) that **only** `@import`s `@ucmp/ui-theme/themes/<brand>` — no token values are copied into Storybook, so the single source of truth stays in `packages/ui-theme`. The default brand needs no stylesheet; it is the `:root` baseline loaded via `styles.css`.

> Why a stylesheet swap rather than a pure attribute toggle? Tailwind v4's `@theme` always emits tokens to `:root`, so two full brand themes cannot coexist and be switched by an attribute alone. The decorator therefore enables exactly one brand stylesheet at a time, each sourced directly from `@ucmp/ui-theme`.

### Surface

The **Surface** toolbar control wraps the story in a `data-surface` container to preview components on light or dark background surfaces. This is independent of the brand theme.

| Option | What it does |
| --- | --- |
| None | No surface wrapper |
| Light | `data-surface="light"` — light background card |
| Dark | `data-surface="dark"` — dark background card |

### next-themes integration

The `withNextThemes` decorator (`.storybook/with-next-themes.tsx`) wraps all stories in a `next-themes` ThemeProvider so that components calling `useTheme()` (e.g., `Toaster`, `ThemeToggle`) render without missing-context errors.

The decorator follows the pattern from [rossyman's Nov 2024 comment](https://github.com/pacocoursey/next-themes/issues/63#issuecomment-2457190283) on next-themes issue #63, using `DecoratorHelpers` from `@storybook/addon-themes` to wire `initializeThemeState` / `pluckThemeFromContext` into the toolbar.

## Adding a New Brand Theme

1. **Create the theme in `packages/ui-theme`:**

   ```
   packages/ui-theme/themes/<brand-name>/
   ├── index.css              # full theme (imports base + overrides + dark + light)
   ├── overrides/
   │   ├── index.css          # imports colors, typography, radius, button-surfaces, tabs-surfaces
   │   ├── colors.css         # OKLCH color palette + surface-aware text primitives
   │   ├── typography.css     # font-family token
   │   ├── radius.css         # border-radius scale
   │   ├── button-surfaces.css  # button colors per data-surface
   │   └── tabs-surfaces.css    # tabs pill colors per data-surface
   ├── light.css              # light mode shadcn color slots
   └── dark.css               # dark mode (.dark class) color slots
   ```

2. **Export the theme** in `packages/ui-theme/package.json`:

   ```json
   "exports": {
     "./themes/<brand-name>": "./themes/<brand-name>/index.css"
   }
   ```

3. **Create a brand entry stylesheet** at `.storybook/brand-<brand-name>.css`. It declares **no token values** — it only re-exports the compiled theme so Storybook can load it as a swappable stylesheet (single source of truth stays in `packages/ui-theme`):

   ```css
   @import "@ucmp/ui-theme/themes/<brand-name>";

   @source "../src/components";
   @source "../src/charts";
   ```

4. **Register the stylesheet** in `.storybook/with-next-themes.tsx`:

   ```ts
   import brandNewUrl from "./brand-<brand-name>.css?url"

   const BRAND_STYLESHEETS: Record<string, string> = {
     acme: brandAcmeUrl,
     "<brand-name>": brandNewUrl, // ← add here
   }
   ```

5. **Add the toolbar entry** in `.storybook/preview.tsx` — a label → brand slug
   pair. The slug must match the `BRAND_STYLESHEETS` key from step 4:

   ```ts
   withNextThemes({
     themes: {
       Default: "default",
       Acme: "acme",
       "<Display Name>": "<brand-name>", // ← add here
     },
     defaultTheme: "Default",
     enableSystem: false,
     disableTransitionOnChange: true,
     storageKey: "storybook-brand",
   })
   ```

   The decorator enables the matching brand stylesheet and next-themes writes
   `<html data-theme="<brand-name>">`.

6. **Load brand fonts** — add `@font-face` declarations to `.storybook/fonts.css`
   or use system fonts in the brand's typography override.
