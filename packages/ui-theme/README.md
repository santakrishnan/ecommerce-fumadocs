# @ucmp/ui-theme

CSS-only design tokens and themes for the UCMP monorepo. Built with Tailwind CSS v4.

## Features

- Pure CSS design tokens (no JavaScript)
- Inheritance-based multi-theme support (default, acme)
- Tailwind CSS v4 `@theme` directive
- OKLCH color format throughout
- Dark mode support via `prefers-color-scheme`
- Decoupled architecture — apps choose their theme
- shadcn-compatible color mapping

## Usage

### Recommended: pick a theme and import only that file

```css
/* app/globals.css */
@import "@ucmp/ui-theme/themes/default";
```

The theme file pulls in base tokens internally — you do not need to import base separately.

### shadcn pattern (OKLCH `:root` variables)

```css
@import "@ucmp/ui-theme/themes/default";

@layer base {
  :root {
    --primary: oklch(0.21 0.006 285.885);
    --primary-foreground: oklch(0.985 0 0);
  }
}

@theme inline {
  --font-sans: var(--font-app-sans), system-ui, sans-serif;
}
```

The theme automatically maps the shadcn `:root` variables to Tailwind utilities (`bg-primary`, `text-primary-foreground`, etc.).

> All color tokens use OKLCH format. Do not use HSL or hex in token definitions.

## Available Imports

```css
/* Just the base tokens (rare — most apps use a theme) */
@import "@ucmp/ui-theme/base";

/* Themes (each is self-contained: base + overrides + light + dark) */
@import "@ucmp/ui-theme/themes/default";
@import "@ucmp/ui-theme/themes/acme";

/* Optional utility classes (truncate-2, glass, scrollbar-thin) */
@import "@ucmp/ui-theme/utilities";
```

## Token Categories

| Category | File | Examples |
| --- | --- | --- |
| Colors | `base/tokens/colors.css` | `--color-brand`, `--color-neutral-50`–`800`, `--color-red-500`, `--color-green-500`, `--color-text-*`, `--color-surface-*`, `--color-overlay` |
| Spacing | `base/tokens/spacing.css` | `--spacing-1` (4px) through `--spacing-20` (80px) — Figma 8px grid |
| Typography | `base/tokens/typography.css` | `--text-2xs`–`9xl`, `--leading-heading`/`body`, `--tracking-tightest`/`tighter` |
| Border radius | `base/tokens/radius.css` | `--radius-md`, `--radius-xl`, `--radius-pill`, `--radius-4xl` |
| Shadows | `base/tokens/shadows.css` | `--shadow-sm`, `--shadow-lg` |
| Breakpoints | `base/tokens/breakpoints.css` | `--breakpoint-sm` (393px), `--breakpoint-md` (768px), `--breakpoint-lg` (1440px), `--breakpoint-xl` (1870px) |
| Sizes | `base/tokens/sizes.css` | `--max-width-8xl`, `--max-width-hero-image` (2556px), `--nav-height` |
| Transitions | `base/tokens/index.css` | `--transition-fast`, `--transition-base`, `--transition-slow` |

## Architecture

```text
@ucmp/ui-theme
├── base/
│   ├── tokens/          # Generic design tokens
│   └── index.css        # Tailwind + tokens + body styles
├── themes/
│   ├── default/         # Neutral starting theme
│   └── acme/            # Example branded theme
└── utilities/           # Optional utility classes
```

See `STRUCTURE.md` for a deep dive on the inheritance pattern and how to add a new brand.

## Creating a new theme

1. Copy `themes/default/` to `themes/your-brand/`
2. Edit `themes/your-brand/overrides/colors.css` with your brand colors (OKLCH format):

   ```css
   @theme {
     --color-primary: oklch(0.65 0.2 40);
     --color-primary-foreground: oklch(1 0 0);
   }
   ```

3. Adjust `themes/your-brand/light.css` and `dark.css`
4. Register the export in `package.json`:

   ```json
   {
     "exports": {
       "./themes/your-brand": "./themes/your-brand/index.css"
     }
   }
   ```

5. Import in your app: `@import "@ucmp/ui-theme/themes/your-brand";`

## Figma → Code Mapping

The complete mapping from Figma design variables to CSS tokens and Tailwind utilities is documented in [`docs/FIGMA-TOKEN-MAPPING.md`](../../docs/FIGMA-TOKEN-MAPPING.md).

Key conversion formulas:

- **Spacing:** Figma unit × 8 = px value. Tailwind utility = px / 4.
- **Colors:** All OKLCH. Achromatic greys use `oklch(L 0 0)`.
- **Typography:** Figma rem values map directly to `--text-*` tokens.

## Peer Dependencies

- `tailwindcss: ^4.0.0`
