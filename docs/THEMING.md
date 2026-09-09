# Theming guide

UCMP ships an inheritance-based, CSS-only theme system built on Tailwind v4's `@theme` directive.

## How it's organised

```text
@ucmp/ui-theme/
├── base/
│   ├── tokens/           Generic tokens (colors, spacing, shadows, …)
│   └── index.css         Tailwind + tokens + body styles
├── themes/
│   ├── default/          Neutral starting theme
│   └── acme/             Example branded theme (purple)
└── utilities/            Optional utility classes (truncate-2, glass, scrollbar-thin)
```

Each theme is **self-contained**: its `index.css` imports base internally, then layers brand overrides on top, then defines light + dark color sets, then exposes the shadcn OKLCH `:root` mapping.

## Using a theme in an app

```css
/* apps/web/src/app/globals.css */
@import "@ucmp/ui-theme/themes/default";

@layer base {
  :root {
    /* Override the shadcn OKLCH variables here */
    --primary: oklch(0.21 0.006 285.885);
    --primary-foreground: oklch(0.985 0 0);
  }
}

@theme inline {
  /* Hook up your next/font variable */
  --font-sans: var(--font-app-sans), system-ui, sans-serif;
}
```

The theme's shadcn mapping (in `themes/default/index.css`) automatically routes `--primary` → `--color-primary` → Tailwind's `bg-primary`, `text-primary-foreground`, etc.

## Adding a new brand

1. Copy `themes/default/` to `themes/your-brand/`
2. Edit `themes/your-brand/overrides/colors.css`:

   ```css
   @theme {
     --color-primary: oklch(0.65 0.2 40);
     --color-primary-foreground: oklch(1 0 0);
   }
   ```

3. Adjust `light.css` and `dark.css` for the semantic palette
4. Register the export in `packages/ui-theme/package.json`:

   ```json
   {
     "exports": {
       "./themes/your-brand": "./themes/your-brand/index.css"
     }
   }
   ```

5. Import in any app: `@import "@ucmp/ui-theme/themes/your-brand";`

## Adding a new design token

1. Drop a new file in `base/tokens/`:

   ```css
   /* base/tokens/animations.css */
   @theme {
     --duration-fast: 150ms;
     --duration-base: 200ms;
   }
   ```

2. Import it in `base/tokens/index.css`:

   ```css
   @import "./animations.css";
   ```

3. Use in any consumer: `class="duration-fast"`, `transition-duration: var(--duration-fast);`

## Color format: OKLCH

All color tokens use **OKLCH** format. This is the shadcn/Tailwind v4 standard.

- Achromatic greys: `oklch(L 0 0)` (e.g. `oklch(0.925 0 0)` for #E6E6E6)
- Alpha values: `oklch(L C H / alpha)` (e.g. `oklch(0 0 0 / 0.7)` for 70% black overlay)
- Do **not** use HSL or hex in token definitions

See [`docs/FIGMA-TOKEN-MAPPING.md`](FIGMA-TOKEN-MAPPING.md) for the complete Figma → token → Tailwind utility mapping.

## Token categories

| Category | File | Example tokens |
| --- | --- | --- |
| Colors (brand, neutral, semantic) | `base/tokens/colors.css` | `--color-brand`, `--color-neutral-400`, `--color-text-muted` |
| Spacing | `base/tokens/spacing.css` | `--spacing-1` through `--spacing-20` |
| Typography | `base/tokens/typography.css` | `--text-2xs`, `--leading-heading`, `--tracking-tightest` |
| Border radius | `base/tokens/radius.css` | `--radius-md`, `--radius-pill`, `--radius-4xl` |
| Shadows | `base/tokens/shadows.css` | `--shadow-sm`, `--shadow-lg` |
| Breakpoints | `base/tokens/breakpoints.css` | `--breakpoint-sm` (393px), `--breakpoint-md` (768px), `--breakpoint-lg` (1440px), `--breakpoint-xl` (1870px) |
| Sizes | `base/tokens/sizes.css` | `--max-width-8xl`, `--max-width-hero-image` (2556px), `--nav-height` |

## Glass utility

The `glass` utility is a visual effect helper defined in `packages/ui-theme/utilities/glass.css`.

```css
.glass {
  backdrop-filter: blur(16px) saturate(1.4);
  -webkit-backdrop-filter: blur(16px) saturate(1.4);
}
```

Use it when you want a frosted effect. The `glass` class only applies blur/saturation and does not set a color.

`glass` is independent from `--color-surface-glass*` and can be applied to any surface.

Example combinations:

- **Effect only (no tint class):** `glass`
- **Frosted + glass tint:** `glass bg-surface-glass`
- **Frosted + other tokens:** `glass bg-card-dark`, `glass bg-opacity-white-12`, etc.

```tsx
<div data-surface="dark" className="glass rounded-lg bg-surface-glass p-4">
  ...
</div>
```

### Surface behavior

The rules below are for the `bg-surface-glass` token specifically (not for the `glass` effect utility):

- `bg-surface-glass` resolves from `--color-surface-glass`
- `data-surface="light"` -> `--color-surface-glass-light` (white / 42%)
- `data-surface="dark"` -> `--color-surface-glass-dark` (black / 33%)

This keeps contrast readable while allowing either plain translucent fills or frosted-glass treatment.

## Dark mode

Each theme's `dark.css` defines the dark palette inside a `@media (prefers-color-scheme: dark)` block. The base theme has its own dark fallback in `base/index.css` for apps that import only base.

To force a theme regardless of OS preference, set `class="light"` or `class="dark"` on `<html>` and switch your dark rule to `:root.dark @theme { … }` instead of the media query.

## Units: rem, px, or em?

Use this table when choosing a unit. The short version: **rem-first**, `px` only for hairlines and breakpoints, `em` only for letter-spacing.

| Use case | Unit | Why |
| --- | --- | --- |
| Spacing — padding, margin, gap | `rem` (Tailwind scale: `p-4`, `gap-6`) | Scales with the user's browser font-size. Critical for accessibility — users who set a larger root font-size get a proportionally larger layout. |
| Font sizes | `rem` (Tailwind scale: `text-sm`, `text-lg`) | Same — respects user zoom and root font-size. Never use `text-[14px]`. |
| Icon sizing | `rem` (Tailwind scale: `size-4`, `size-5`) | Should grow with surrounding text. |
| Border radius | `rem` for shape sizing (`rounded-md`); `9999px` for pills | Tailwind defaults are correct. |
| Border widths | `px` (Tailwind's `border` is `1px`) | Hairlines should stay 1 device pixel regardless of font-size. |
| Focus rings, outlines | `px` | Same reason as borders. |
| Breakpoints (`sm`, `md`, `lg`) | `px` (Tailwind default) | Viewport-based, independent of font-size. |
| Container queries | `rem` preferred | Component-relative; pairs well with rem-based sizing inside. |
| Letter spacing (`tracking-*`) | `em` (Tailwind default) | Proportional to current font-size — what designers want. |
| Line height (`leading-*`) | unitless (`1.5`) or `rem` | Unitless inherits proportionally. Avoid `px`. |

### Why rem matters for accessibility

Two real user behaviours rely on rem:

1. **Browser font-size setting.** Users with low vision change `Settings → Appearance → Font size` from "Medium" (16px) to "Very Large" (24px). Layouts built with `rem` grow proportionally. Layouts built with `px` ignore this setting entirely — text gets bigger, but containers, buttons, and spacing stay frozen, producing overflow and clipping.
2. **Browser zoom.** `Ctrl/Cmd +` zoom works on both, but page-zoom + rem composes more predictably for designers verifying at 200% (WCAG 1.4.4 success criterion).

### The trap: arbitrary px values

Arbitrary values like `p-[14px]`, `text-[15px]`, or `gap-[10px]` are the common failure mode. They:

- Break the spacing scale → visual drift across components
- Don't scale with user font-size → accessibility regression
- Hide design intent → reviewers can't tell if it's intentional or a typo

If you really need a value between the scale steps, extend the scale instead:

```css
@theme {
  --spacing-3-5: 0.875rem; /* 14px at default root size */
}
```

Then use `p-3.5` — a real token, used consistently, scales correctly.

### Lint enforcement

Biome v2 doesn't have a built-in rule to reject arbitrary px values in Tailwind classes (only `useSortedClasses` for ordering). This rule is enforced via code review and the AGENTS.md Do/Don't table.

## When to override vs. add a new theme

- **Override** in `themes/default/overrides/colors.css` if you want one brand and want to evolve from the neutral base.
- **Add a new theme folder** if you ship multiple brands from the same monorepo (e.g. a marketing site + a product app with different palettes).

## Related docs

- [`docs/FIGMA-TOKEN-MAPPING.md`](FIGMA-TOKEN-MAPPING.md) — Complete Figma variable → CSS token → Tailwind utility mapping
- [`packages/ui-theme/STRUCTURE.md`](../packages/ui-theme/STRUCTURE.md) — Directory structure and theme inheritance diagram
