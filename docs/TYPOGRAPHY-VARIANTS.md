# Typography Utilities

Single-class Tailwind v4 utilities that encapsulate complete Figma typographic presets. Each class sets font-family, font-size, font-weight, line-height, letter-spacing, and any non-typographic treatments in one shot.

**Source:** `packages/ui-theme/utilities/typography.css` (utilities) and `packages/ui-theme/themes/default/overrides/typography.css` (default-theme descender behavior)
**Storybook:** Foundation / Typography

## Usage

```html
<h1 class="h1">Page Title</h1>
<p class="body-lg">Default paragraph text.</p>
<span class="vehicle-title-md">RAV4 Prime</span>
```

Utilities are presentation-only — they don't enforce semantic HTML. Apply `h1` to a `<span>` if that's what the design calls for.

### Truncation and descender safety

Typography utilities do not include truncation by default. In components, `truncate` /
`line-clamp-*` may be applied separately (either on the same element or on a parent wrapper).

When using `truncate` or `line-clamp-*`, some combinations of font size/line-height can clip
descenders (`g`, `j`, `p`, `q`, `y`).

This is font-dependent: families with deeper descenders, tighter vertical metrics, or stronger
optical overshoot can draw glyph pixels below the layout box baseline that truncation/clamp
containers clip with `overflow: hidden`.

The theme applies descender-safe padding directly to existing Tailwind truncation classes
(`truncate`, `line-clamp-*`) and resolves padding from typography context when available.
**This is handled automatically — `--typo-descender-padding` is an internal implementation
detail and is not expected to be overridden at the app level.**

Supported class placement patterns:

1. Same element has both typography + truncation classes.
2. Parent has typography class; child has `truncate` / `line-clamp-*`.

> **⚠️ Pattern that does NOT work automatically:** placing `truncate` / `line-clamp-*` on a
> **parent** while the typography class is on a **child**. CSS custom properties only inherit
> parent → child, so `--typo-descender-padding` set on the child cannot be read by the parent's
> truncation rule.

```html
<!-- Same element: typography + Tailwind truncate -->
<p class="body-md truncate">Long single-line value…</p>

<!-- Parent has typography class; child has truncation — inherits --typo-descender-padding ✅ -->
<div class="body-md">
  <p class="line-clamp-2">Long multi-line value…</p>
</div>

<!-- Tailwind line clamp -->
<p class="body-lg line-clamp-2">Long multi-line value…</p>
```

**Internal reference** — Default `--typo-descender-padding` values per variant, defined in
`packages/ui-theme/themes/default/overrides/typography.css`:

- `0.16em`: `number-*`, `h1`, `h2`, `h3`, `subhead-*`, `link-text`
- `0.18em`: `button-text`
- `0.10em`: `body-*`, `disclaimer`
- `0em`: `vehicle-title-*`, `carousel-headline`

### Responsive prefixes

Most utilities scale automatically at breakpoints — check the tables below. For cases where a component needs a custom breakpoint handoff (per Figma), combine with Tailwind responsive prefixes:

```html
<p class="body-sm xl:body-lg">Small on mobile, larger at xl.</p>
```

## Available Utilities

### Breakpoints

| Token | Width |
|---|---|
| `lg` | 1440px |
| `xl` | 1870px |

### Numbers

| Utility | Mobile | ≥ lg | ≥ xl | Weight | Extra |
|---|---|---|---|---|---|
| `number-xl` | 48px | 56px | 72px | Bold | — |
| `number-lg` | 32px | — | 42px | Bold | — |

### Headings

| Utility | Mobile | ≥ lg | ≥ xl | Weight | Extra |
|---|---|---|---|---|---|
| `h1` | 28px | 32px | 42px | Bold | — |
| `h2` | 24px | 28px | 42px | Bold | — |
| `h3` | 22px | 24px | 30px | Bold | — |

### Vehicle Titles

| Utility | Mobile | ≥ lg | ≥ xl | Weight | Extra |
|---|---|---|---|---|---|
| `vehicle-title-lg` | 24px | 28px | 36px | Bold | uppercase |
| `vehicle-title-md` | 16px | 24px | 28px | Bold | uppercase |
| `vehicle-title-sm` | 14px | 16px | 20px | Bold | uppercase |

### Subheads

| Utility | Mobile | ≥ xl | Weight | Extra |
|---|---|---|---|---|
| `subhead-lg` | 16px | 20px | Semibold | — |
| `subhead-sm` | 14px | 18px | Semibold | — |

### Body

| Utility | Mobile | ≥ lg | ≥ xl | Weight | Extra |
|---|---|---|---|---|---|
| `body-xxl` | 22px | 28px | 36px | Normal | — |
| `body-xl` | 18px | 24px | 32px | Normal | — |
| `body-lg` | 16px | — | 20px | Normal | — |
| `body-md` | 14px | — | 18px | Normal | — |
| `body-sm` | 12px | — | 14px | Normal | — |
| `disclaimer` | 10px | — | 12px | Normal | — |

### Interactive

| Utility | Mobile | ≥ xl | Weight | Extra |
|---|---|---|---|---|
| `carousel-headline` | 14px | 18px | Bold | uppercase |
| `button-text` | 14px | 16px | Semibold | — |
| `link-text` | 12px | 14px | Semibold | — |

## Design System Rules

| Category | Line Height | Letter Spacing |
|---|---|---|
| Headings, Numbers, Vehicle Titles, Subheads, Interactive | 1.05 (`--leading-heading`) | -4% (`--tracking-tightest`) |
| Body text | 1.3 (`--leading-body`) | -2% (`--tracking-tighter`) |

- **Font family** — always `var(--font-sans)` (Toyota Type at runtime via `next/font`)
- **Responsive breakpoints** — `lg` (1440px) and `xl` (1870px), mobile-first. See the tables above for which utilities step at which breakpoints.
- **Font weights** — Normal (400) for body, Semibold (600) for subheads/interactive, Bold (700) for headings/numbers

## Token Dependencies

All values resolve through the design token system in `packages/ui-theme/base/tokens/typography.css`:

- `--text-2xs` through `--text-7xl` — font sizes
- `--font-weight-normal`, `--font-weight-semibold`, `--font-weight-bold` — weights
- `--leading-heading`, `--leading-body` — line heights
- `--tracking-tightest`, `--tracking-tighter` — letter spacing
- `--font-sans` — font family (overridden per-brand via `--font-app-sans`)

Brand overrides to these tokens automatically propagate to all typography utilities.

## File Structure

```
packages/ui-theme/
├── base/
│   ├── index.css              ← imports typography utilities
│   └── tokens/typography.css  ← token definitions
├── utilities/
│   ├── index.css              ← optional utility bundle (may include typography)
│   └── typography.css         ← typography utility definitions (this file)
└── themes/default/
    └── overrides/typography.css ← font-family + descender compensation defaults
```
