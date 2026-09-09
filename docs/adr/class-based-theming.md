# ADR-0002: Class-based theming with next-themes + Tailwind v4

| | |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-05-20 |
| **Authors** | Scaffolding team |
| **Stakeholders** | Engineering, Design, Accessibility |
| **Supersedes** | — |
| **Superseded by** | — |

## 1. Context

ucmp ships a Tailwind v4 + shadcn-style design system in `@ucmp/ui` and a
themable token layer in `@ucmp/ui-theme`. The app supports light / dark mode
with user override **and** OS-preference fallback. Two patterns were in the
codebase simultaneously:

1. **`@layer base { .dark { … } }`** — class-based palette, toggled by
   next-themes' inline script writing `<html class="dark">`.
2. **`@media (prefers-color-scheme: dark) { @theme { … } }`** — OS-driven
   palette, ignores any user override.

Both palettes coexisting produced a real bug: on a dark-mode OS, when the
user explicitly picked "Light" in the toggle, next-themes set
`<html class="light">` (so the `.dark` block didn't apply) — but the media
query in `themes/default/dark.css` still fired because the OS was still in
dark mode. The user clicked "Light" and the page stayed dark.

We also need the pattern to scale to:

- Multiple brands (current example: `default`, `acme`).
- A consistent token API across modes (`bg-background`, `text-foreground`).
- SSR with no flash of the wrong palette on hard refresh.
- An "obvious where to add a new mode" extension path (e.g. `high-contrast`).

## 2. Decision

**The palette is class-driven, not media-driven. The class is set by
next-themes. The class lives on `<html>`. The variant
`@custom-variant dark (&:where(.dark, .dark *))` enables `dark:` utilities.**

Concretely:

- `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` at
  the root layout. `enableSystem` makes next-themes resolve `"system"` to
  the right class based on `prefers-color-scheme` — that's where OS
  preference flows in, not via a CSS media query.
- Each theme folder owns:
  - `index.css` — imports base, overrides, light, dark, plus the shadcn
    `@theme` mapping.
  - `light.css` — `@theme { --color-*: … }` (the build-time default).
  - `dark.css` — `@layer base { .dark { --color-*: … } }` (override).
  - `overrides/*.css` — brand-specific token overrides.
- `base/` contains only Tailwind, design tokens, the `@custom-variant`, and
  the body baseline. **No palette declarations in base.**

### Why not the OS media query

A media query overrides the user's stated preference under the most common
mismatch case (OS=dark, user picks Light). For a product with a toggle, this
is a hard accessibility failure: users with light-sensitivity who set the OS
to dark for *most* apps but need light for *yours* cannot get there.

The media query is correct **only when there is no user toggle**. We have
one.

### Why class, not data-attribute

For one theme × two modes, `<html class="dark">` is the shortest path,
matches every shadcn / Tailwind v4 example out there, and DevTools-toggling
the class is the fastest debug path.

We will switch to `data-theme="<brand>-<mode>"` (or
`data-brand` + `data-theme` pair) **when we hit 3+ brands or add a third
axis** (density, contrast). At that point the class becomes brittle
(combining `acme dark high-contrast`) and orthogonal attributes are clearer.
This is the path Linear, Slack, Notion, Stripe Dashboard, and Polaris use.

We do not pre-emptively migrate.

## 3. Implementation

### Provider (app root)

```tsx
// apps/web/src/app/layout.tsx
import { ThemeProvider } from "@ucmp/shared/providers";

<html lang="en" suppressHydrationWarning>
  <body>
    <ThemeProvider /* defaults: attribute="class", defaultTheme="system" */>
      …
    </ThemeProvider>
  </body>
</html>
```

`suppressHydrationWarning` on `<html>` is **required** — next-themes' inline
script mutates the class before React hydrates, which would otherwise trip
React's hydration check.

### Base (`packages/ui-theme/base/index.css`)

```css
@import "tailwindcss";
@import "./tokens/index.css";

@custom-variant dark (&:where(.dark, .dark *));

body { @apply bg-background text-foreground; /* …font setup… */ }
```

No `.dark { }` block here. Palettes are owned by themes.

### Theme dark file (`packages/ui-theme/themes/<brand>/dark.css`)

```css
@layer base {
  .dark {
    --color-background: oklch(0.141 0.005 285.823);
    --color-foreground: oklch(0.985 0 0);
    /* … */
  }
}
```

The `@layer base` wrapper places the override in the cascade layer above
`@theme` (which lives in the `theme` layer), so the `.dark` rule wins over
the light defaults without specificity tricks.

### Toggle (`@ucmp/ui`)

Ships as `ThemeToggle` — see [THEME-TOGGLE.md](../THEME-TOGGLE.md). Imports
`useTheme` directly from `next-themes`; does **not** route through
`@ucmp/shared/providers` because that module's `useTheme` is a literal
re-export and adds an indirection with no abstraction value.

## 4. Consequences

### Positive

- One source of truth per palette. Add a new brand by copying a theme folder.
- User override works correctly on every OS preference.
- No CSS specificity wars: tokens flow through `:root` → `.dark` cascade.
- `dark:` Tailwind utilities work via `@custom-variant`.
- Hard refresh → no flash (next-themes' inline script handles it).
- Adding a new mode (`.high-contrast`) is one more class-based block,
  composable with `.dark`.

### Negative

- Anyone copy-pasting an old "media query dark mode" snippet into a theme
  file will reintroduce the bug. Mitigation: lint the `ui-theme` package
  against `@media (prefers-color-scheme: dark)` (TODO; for now, ADR + docs).
- next-themes is a runtime dependency. For static-site / no-JS exports, you
  would need to switch to the media-query pattern and drop the toggle.

### Neutral

- `theme: "system"` resolves to `light` when `matchMedia` is unavailable
  (e.g., jsdom in tests). The acceptance matrix in
  [THEME-TOGGLE.md](../THEME-TOGGLE.md) covers this explicitly.
- The shadcn HSL `:root` mapping at the bottom of each theme's `index.css`
  ports cleanly to data-attribute selectors when we eventually migrate.

## 5. Alternatives considered

### A. `@media (prefers-color-scheme: dark)` only, no toggle

**Rejected.** No user override is a non-starter for an accessibility-driven
product. Some users need light on a dark OS (and vice versa).

### B. `data-theme="<mode>"` attribute on `<html>` from day one

**Rejected for now.** Adds one attribute selector level of indirection
without paying off until brand/mode count grows. Plan: migrate when we hit
3+ brands or add a third axis. The token API (`bg-background`) doesn't
change — only the selector in the `:root` mapping.

### C. CSS-in-JS theme provider (Emotion / styled-components)

**Rejected.** Tailwind v4 + CSS variables is the project's primary styling
path (see AGENTS.md "Styling & theming"). Adding a JS theme runtime would
duplicate that surface.

### D. Three-tier tokens (raw → semantic → component) from day one

**Deferred.** Materially valuable when an external design team owns a
palette in tier-1 ("brand-blue-500"), but the shadcn OKLCH defaults are
semantic-ish on their own. Reintroduce tier 1 when the design team starts
publishing a palette spec; component tokens (tier 3) emerge naturally on
components that need them.

## 6. Validation

See [`docs/THEME-TOGGLE.md`](../THEME-TOGGLE.md) §"Validation playbook" for
the six-row acceptance matrix and DevTools instructions. The critical row
is **OS=dark, selection=Light → background must be light** — that's the
one this ADR fixes.

## 7. References

- next-themes — https://github.com/pacocoursey/next-themes
- Tailwind v4 `@custom-variant` — https://tailwindcss.com/docs/v4-beta#custom-variants
- shadcn theming — https://ui.shadcn.com/docs/theming
- [`docs/THEMING.md`](../THEMING.md) — token strategy, OKLCH, rem/px/em units
- [`docs/THEME-TOGGLE.md`](../THEME-TOGGLE.md) — toggle usage + validation
- AGENTS.md "Styling & theming" — Do/Don't reference
