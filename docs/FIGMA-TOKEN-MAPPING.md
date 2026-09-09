# Figma → Tailwind 4 Token Mapping

This document maps the Figma design system variables (from `Home--Shared-`) to the `@ucmp/ui-theme` CSS tokens using Tailwind v4's `@theme` directive.

## Spacing Scale

Figma uses a numbered unit system where each unit = 8px.

| Figma Variable | Value | Tailwind Utility | CSS Token |
|---|---|---|---|
| `0,5` | 4px | `p-1`, `gap-1` | `--spacing-1` |
| `1` | 8px | `p-2`, `gap-2` | `--spacing-2` |
| `1,5` | 12px | `p-3`, `gap-3` | `--spacing-3` |
| `2` | 16px | `p-4`, `gap-4` | `--spacing-4` |
| `2,5` | 20px | `p-5`, `gap-5` | `--spacing-5` |
| `3` | 24px | `p-6`, `gap-6` | `--spacing-6` |
| `4` | 32px | `p-8`, `gap-8` | `--spacing-8` |
| `5` | 40px | `p-10`, `gap-10` | `--spacing-10` |
| `6` | 48px | `p-12`, `gap-12` | `--spacing-12` |
| `7` | 56px | `p-14`, `gap-14` | `--spacing-14` |
| `7,5` | 60px | `size-15` | `--spacing-15` |
| `8` | 64px | `p-16`, `gap-16` | `--spacing-16` |
| `9` | 72px | `p-18`, `gap-18` | `--spacing-18` |
| `10` | 80px | `p-20`, `gap-20` | `--spacing-20` |

**Mapping formula:** Figma unit × 8 = px value. Tailwind utility = px / 4.

## Breakpoints

The design system has four breakpoints matching the Figma frames:

| Breakpoint | Figma Frame Width | Tailwind Prefix | CSS Token | Usage |
|---|---|---|---|---|
| Mobile (X-Small) | 393px | (default — no prefix) | `--breakpoint-sm` | Base styles, mobile-first |
| Tablet (Small) | 768px | `md:` | `--breakpoint-md` | Tablet layout |
| Desktop (Medium) | 1440px | `lg:` | `--breakpoint-lg` | Desktop layout |
| Wide (Large) | 1870px | `xl:` | `--breakpoint-xl` | Wide desktop layout |

**Responsive pattern:** Write mobile-first, then layer `md:` for tablet, `lg:` for desktop, and `xl:` for wide desktop.

```css
/* Example: card grid */
.card-grid {
  @apply grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-2 lg:grid-cols-3 lg:gap-2 xl:grid-cols-4 xl:gap-2;
}
```

## Grid System

The Figma design system defines a responsive column grid with consistent gutters and responsive margins.

| Breakpoint | Frame Width | Columns | Margin | Gutter | Tailwind Pattern |
|---|---|---|---|---|---|
| Small (default) | 393px | 4 | 20px (`px-5`) | 8px (`gap-x-2`) | `grid grid-cols-4 gap-x-2 px-5` |
| Medium (`md:`) | 768px | 8 | 20px (`px-5`) | 8px (`gap-x-2`) | `md:grid-cols-8` |
| Large (`lg:`) | 1440px | 12 | 40px (`px-10`) | 8px (`gap-x-2`) | `lg:grid-cols-12 lg:px-10` |

**Key observations:**
- Gutter is constant at **8px** (`gap-x-2`) across all breakpoints
- Vertical rhythm is controlled independently with `gap-y-*`
- Margins are **20px** on mobile/tablet, **40px** on desktop
- Column count scales: 4 → 8 → 12

**Common span patterns:**

| Content Type | Mobile (4 cols) | Tablet (8 cols) | Desktop (12 cols) |
|---|---|---|---|
| Full width | `col-span-4` | `md:col-span-8` | `lg:col-span-12` |
| Half width | `col-span-2` | `md:col-span-4` | `lg:col-span-6` |
| Third width | `col-span-4` | `md:col-span-4` | `lg:col-span-4` |
| Quarter width | `col-span-2` | `md:col-span-2` | `lg:col-span-3` |

Use the `PageGrid` component from `@ucmp/ui` for the standard page-level grid wrapper (see `packages/ui/src/components/page-grid.tsx`).

**Typography is mostly NOT responsive** — The Figma "Mobile/" typography styles use identical sizes, weights, line-heights, and letter-spacing as desktop for body text and headings H2/H3. Only layout (grid columns, padding, card sizes) changes between breakpoints.

**Exception — Returning user pages use responsive headings:**

| Style | Mobile/Tablet | Desktop | Tailwind Pattern |
|---|---|---|---|
| H1 | 28px (`text-3xl`) | 32px (`text-4xl`) | `text-3xl xl:text-4xl` |
| Large Numbers | 48px (`text-5xl`) | 56px (`text-6xl`) | `text-5xl xl:text-6xl` |

This only applies to the returning user landing page. The new user landing page uses 32px H1 and 56px Large Numbers at all breakpoints.

## Typography

### Font Sizes

| Figma Variable | Value | Tailwind Utility | CSS Token |
|---|---|---|---|
| `_Font Size/0,625rem` | 10px | `text-2xs` | `--text-2xs` |
| `typography/Body-Small` | 12px | `text-xs` | `--text-xs` |
| `typography/Body-Medium` | 14px | `text-sm` | `--text-sm` |
| `typography/Body-Large` | 16px | `text-base` | `--text-base` |
| `_Font Size/1,375rem` | 22px | `text-1.5xl` | `--text-1.5xl` |
| `typography/Body-xxl` | 28px | `text-3xl` | `--text-3xl` |
| `typography/Body-xl` | 24px | `text-2xl` | `--text-2xl` |
| `typography/h3` | 24px | `text-2xl` | `--text-2xl` |
| `typography/h2` | 28px | `text-3xl` | `--text-3xl` |
| `typography/h1` | 32px | `text-4xl` | `--text-4xl` |
| `typography/Large-numbers` | 56px | `text-6xl` | `--text-6xl` |

### Line Heights

| Figma Pattern | Value | Tailwind Utility | CSS Token |
|---|---|---|---|
| Headings, Buttons, Links | 1.05 | `leading-heading` | `--leading-heading` |
| Body text (all sizes) | 1.3 | `leading-body` | `--leading-body` |

### Letter Spacing

| Figma Pattern | Value | Tailwind Utility | CSS Token |
|---|---|---|---|
| Headings, Buttons, Links | -4% of font size | `tracking-tightest` | `--tracking-tightest` |
| Body text (all sizes) | -2% of font size | `tracking-tighter` | `--tracking-tighter` |

### Typography Styles → Tailwind Class Combinations

| Figma Style | Tailwind Classes |
|---|---|
| `Typography/H1 - Bold` | `text-4xl font-bold leading-heading tracking-tightest` |
| `Typography/H2` | `text-3xl font-bold leading-heading tracking-tightest` |
| `Typography/H3` | `text-2xl font-bold leading-heading tracking-tightest` |
| `Typography/Subhead` | `text-base font-semibold leading-heading tracking-tightest` |
| `Typography/Body - XL` | `text-2xl font-normal leading-body tracking-tighter` |
| `Typography/Body - XXL` | `text-3xl font-normal leading-body tracking-tighter` |
| `Typography/Body - Large` | `text-base font-normal leading-body tracking-tighter` |
| `Typography/Body - Medium` | `text-sm font-normal leading-body tracking-tighter` |
| `Typography/Body - Small` | `text-xs font-normal leading-body tracking-tighter` |
| `Typography/Disclaimer` | `text-2xs font-normal leading-body tracking-tighter` |
| `Typography/Large Numbers` | `text-6xl font-bold leading-heading tracking-tightest` |
| `Typography/Button Text` | `text-sm font-semibold leading-heading tracking-tightest` |
| `Typography/Link Text` | `text-xs font-semibold leading-heading tracking-tightest` |
| `Typography/Carousel Headlines` | `text-sm font-bold leading-heading tracking-tightest` |

## Colors

### Text Colors

#### Non-surface-aware (static)

| Figma Variable | Hex | Tailwind Utility | CSS Token |
|---|---|---|---|
| `Text/White` | #FFFFFF | `text-text-inverse` | `--color-text-inverse` |
| `Text/Grey` (Neutral/400) | #9E9E9E | `text-text-muted` | `--color-text-muted` |
| `Styling/Grey Dark` (Neutral/500) | #585958 | `text-text-subtle` | `--color-text-subtle` |

#### Surface-aware (switch via `data-surface`)

These tokens resolve to different values depending on whether the ancestor has `data-surface="light"` or `data-surface="dark"`:

| Figma Variable | Tailwind Utility | CSS Token | Light value | Dark value |
|---|---|---|---|---|
| `Text/Black` | `text-text-primary` | `--color-text-primary` | Neutral/800 (#000000) | Neutral/50 (#FFFFFF) |
| `Text/Grey Dark` | `text-text-secondary` | `--color-text-secondary` | Neutral/500 (#585958) | Neutral/200 (#E6E6E6) |
| `Text/Grey` | `text-text-tertiary` | `--color-text-tertiary` | Neutral/400 (#9E9E9E) | Neutral/300 (#C4C4C4) |
| `Text/Inactive` | `text-text-inactive` | `--color-text-inactive` | black @ 26% | white @ 26% |

#### Primitives (used internally by surface selectors)

| Figma Variable | Hex | CSS Token | Notes |
|---|---|---|---|
| `Text/Primary - Light` | #000000 | `--color-text-primary-light` | Maps to Neutral/800; consumed via `var()` in light surface selector |
| `Text/Secondary - Light` | #585958 | `--color-text-secondary-light` | Maps to Neutral/500; consumed via `var()` in light surface selector |
| `Text/Tertiary - Light` | #9E9E9E | `--color-text-tertiary-light` | Maps to Neutral/400; consumed via `var()` in light surface selector |
| `Text/Inactive - Light` | #000000 @ 26% | `--color-text-inactive-light` | Consumed via `var()` in light surface selector |
| `Text/Primary - Dark` | #FFFFFF | `--color-text-primary-dark` | Maps to Neutral/50; consumed via `var()` in dark surface selector |
| `Text/Secondary - Dark` | #E6E6E6 | `--color-text-secondary-dark` | Maps to Neutral/200; consumed via `var()` in dark surface selector |
| `Text/Tertiary - Dark` | #C4C4C4 | `--color-text-tertiary-dark` | Maps to Neutral/300; consumed via `var()` in dark surface selector |
| `Text/Inactive - Dark` | #FFFFFF @ 26% | `--color-text-inactive-dark` | Consumed via `var()` in dark surface selector |

### Surface / Background Colors

| Figma Variable | Hex | Tailwind Utility | CSS Token |
|---|---|---|---|
| `Styling/White` (Neutral/50) | #FFFFFF | `bg-surface-primary` | `--color-surface-primary` |
| `Styling/Grey light` (Neutral/200) | #E6E6E6 | `bg-surface-secondary` | `--color-surface-secondary` |
| `Styling/Grey Mid` (Neutral/400) | #9E9E9E | `bg-surface-muted` | `--color-surface-muted` |
| `Styling/Black` (Neutral/800) | #000000 | `bg-surface-dark` | `--color-surface-dark` |
| `Styling/Inactive state` | #F0F0F0 | `bg-surface-inactive` | `--color-surface-inactive` |
| `Styling/Overlay` | #000000 @ 70% | `bg-overlay` | `--color-overlay` |
| --- | #FFFFFF @ 60% | `bg-surface-inverse-muted` | `--color-surface-inverse-muted` |

#### Surface-aware glass (switch via `data-surface`)

| Figma Variable | Tailwind Utility | CSS Token | Light value | Dark value |
|---|---|---|---|---|
| Glass panel overlay | `bg-surface-glass` | `--color-surface-glass` | #FFFFFF @ 42% | #000000 @ 33% |

Glass blur effect utility:

| Figma Intent | Tailwind Utility | Source file | Notes |
|---|---|---|---|
| Frosted glass blur/saturation | `glass` | `packages/ui-theme/utilities/glass.css` | Independent effect utility; can be combined with any background token or used alone |

Example usage pattern:

```tsx
<div data-surface="dark" className="glass bg-surface-glass rounded-lg">
  ...
</div>
```

Effect-only pattern (no tint class):

```tsx
<div className="glass rounded-lg">
  ...
</div>
```

Primitives:

| Figma Variable | Value | CSS Token |
|---|---|---|
| Glass surface - Light | oklch(1 0 0 / 0.42) | `--color-surface-glass-light` |
| Glass surface - Dark | oklch(0 0 0 / 0.33) | `--color-surface-glass-dark` |

#### Card surface (static — not surface-aware)

Used by `PanelCard` and heavier overlay cards (e.g. PurchaseCard, SoldCtaCard). Always dark.

| Tailwind Utility | CSS Token | Value |
|---|---|---|
| `bg-card-dark` | `--color-card-dark` | #000000 @ 70% |
| `bg-card-light` | `--color-card-light` | #FFFFFF @ 42% |
| `bg-card-md-light` | `--color-card-md-light` | #FFFFFF @ 20% |

Primitives:

| Figma Variable | Value | CSS Token | Notes |
|---|---|---|---|
| Card surface - Light | oklch(1 0 0 / 0.42) | `--color-card-light` | Opacity/White 42% |
| Card surface - Medium Light | oklch(1 0 0 / 0.2) | `--color-card-md-light` | Opacity/White 20% |
| Card surface - Dark | oklch(0 0 0 / 0.7) | `--color-card-dark` | Opacity/Black 70% |

### Brand Colors

| Figma Variable | Hex | Tailwind Utility | CSS Token |
|---|---|---|---|
| `Styling/Brand red` | #EB0A1E | `bg-brand`, `text-brand` | `--color-brand` |

### Neutral Scale

| Figma Variable | Hex | Tailwind Utility | CSS Token |
|---|---|---|---|
| Neutral/50 | #FFFFFF | `bg-neutral-50` | `--color-neutral-50` |
| Neutral/100 | #F5F5F5 | `bg-neutral-100` | `--color-neutral-100` |
| Neutral/200 | #E6E6E6 | `bg-neutral-200` | `--color-neutral-200` |
| Neutral/300 | #C4C4C4 | `bg-neutral-300` | `--color-neutral-300` |
| Neutral/400 | #9E9E9E | `text-neutral-400` | `--color-neutral-400` |
| Neutral/500 | #585958 | `text-neutral-500` | `--color-neutral-500` |
| Neutral/600 | #3D3D3D | `text-neutral-600` | `--color-neutral-600` |
| Neutral/700 | #1F1F1F | `bg-neutral-700` | `--color-neutral-700` |
| Neutral/800 | #000000 | `bg-neutral-800` | `--color-neutral-800` |

### Red Scale (Error / Destructive)

| Figma Variable | Hex | Tailwind Utility | CSS Token |
|---|---|---|---|
| Red/50 | #FFF1F4 | `bg-red-50` | `--color-red-50` |
| Red/500 | #EF1541 | `text-red-500`, `bg-red-500` | `--color-red-500` |

### Green Scale (Success)

| Figma Variable | Hex | Tailwind Utility | CSS Token |
|---|---|---|---|
| Green/50 | #E6F6EB | `bg-green-50` | `--color-green-50` |
| Green/500 | #05AC3F | `text-green-500`, `bg-green-500` | `--color-green-500` |

### Warm Grey (Accent)

| Figma Variable | Hex | Tailwind Utility | CSS Token |
|---|---|---|---|
| `Styling/Warm Grey` | #5B5553 | `bg-warm-grey`, `text-warm-grey` | `--color-warm-grey` |

> TODO verify token

### Skeleton (Loading placeholder)
| Figma Variable | Hex | Tailwind Utility | CSS Token |
|---|---|---|---|
| `Text/Grey` (Neutral/400) | #9E9E9E | `bg-skeleton` | `--color-skeleton` |

### Divider

Surface-aware — switches value based on `data-surface`:

| Tailwind Utility | CSS Token | Light value | Dark value |
|---|---|---|---|
| `border-divider` | `--color-divider` | black @ 20% | white @ 20% |

Primitives (used internally by surface selectors):

| Figma Variable | Hex | CSS Token |
|---|---|---|
| `Divider - Light` | #000000 @ 20% | `--color-divider-light` |
| `Divider - Dark` | #FFFFFF @ 20% | `--color-divider-dark` |

### Opacity Tokens

| Figma Variable | Hex | Tailwind Utility | CSS Token |
|---|---|---|---|
| `Opacity/White 12` | #FFFFFF @ 12% | `bg-opacity-white-12`, `border-opacity-white-12` | `--color-opacity-white-12` |
| `Opacity/White 16` | #FFFFFF @ 16% | `bg-opacity-white-16`, `border-opacity-white-16` | `--color-opacity-white-16` |
| `Opacity/White 20` | #FFFFFF @ 20% | `bg-opacity-white-20`, `border-opacity-white-20` | `--color-opacity-white-20` |
| `Opacity/White 26` | #FFFFFF @ 26% | `bg-opacity-white-26`, `border-opacity-white-26` | `--color-opacity-white-26` |
| `Opacity/White 40` | #FFFFFF @ 40% | `bg-opacity-white-40`, `border-opacity-white-40` | `--color-opacity-white-40` |
| `Opacity/Black 12` | #000000 @ 12% | `bg-opacity-black-12`, `border-opacity-black-12` | `--color-opacity-black-12` |
| `Opacity/Black 16` | #000000 @ 16% | `bg-opacity-black-16`, `border-opacity-black-16` | `--color-opacity-black-16` |
| `Opacity/Black 20` | #000000 @ 20% | `bg-opacity-black-20`, `border-opacity-black-20` | `--color-opacity-black-20` |
| `Opacity/Black 26` | #000000 @ 26% | `bg-opacity-black-26`, `border-opacity-black-26` | `--color-opacity-black-26` |
| `Opacity/Black 40` | #000000 @ 40% | `bg-opacity-black-40`, `border-opacity-black-40` | `--color-opacity-black-40` |

## Shadows
| Figma Variable | Hex | Tailwind Utility | CSS Token |
|---|---|---|---|
| --- | #00000040 | `shadow-hover` | `--shadow-hover` |
| Dropdown Menu | #1D1D1F1F | `shadow-dropdown` | `--shadow-dropdown` |

## Border Radius

| Figma Usage | Value | Tailwind Utility | CSS Token |
|---|---|---|---|
| Input fields | 8px | `rounded-md` | `--radius-md` |
| Browser chrome | 12px | `rounded-lg` | `--radius-lg` |
| Cards (all types) | 16px | `rounded-xl` | `--radius-xl` |
| Large panels | 20px | `rounded-2xl` | `--radius-2xl` |
| Badges | 30px | `rounded-3xl` | `--radius-3xl` |
| Search prompt, slider track | 40px | `rounded-4xl` | `--radius-4xl` |
| Navigation pills | 50px | `rounded-pill` | `--radius-pill` |
| Buttons, circular icons | 9999px | `rounded-full` | `--radius-full` |
| Bottom sheet top corners | 24px | `rounded-tl-drawer-top rounded-tr-drawer-top` | `--radius-drawer-top` |
| Bottom sheet bottom corners | 32px | `rounded-bl-drawer-bottom rounded-br-drawer-bottom` | `--radius-drawer-bottom` |

## Component Token Usage

### Cards (Editorial, Inventory, Dealer, Category)
```
rounded-xl overflow-clip px-8 py-10
```

### Buttons (Primary)
```
bg-surface-dark text-text-inverse rounded-full px-6 py-5
text-sm font-semibold leading-heading tracking-tightest
```

### Button Surface Tokens (Figma node 4014-524)

Button color tokens are surface-aware and defined in `packages/ui-theme/themes/default/overrides/button-surfaces.css`. They switch via `data-surface`.

#### Primary

| State | Token | Light value | Dark value |
|---|---|---|---|
| Background | `--btn-primary-bg` | `--color-surface-dark` | `--color-neutral-50` |
| Text | `--btn-primary-text` | `--color-text-primary-dark` | `--color-text-primary-light` |
| Hover BG | `--btn-primary-bg-hover` | `--color-neutral-700` | `--color-neutral-200` |
| Hover text | `--btn-primary-text-hover` | `--color-text-primary-dark` | `--color-text-primary-light` |
| Disabled BG | `--btn-primary-disabled-bg` | `--color-surface-inactive` | `--color-neutral-200` |
| Disabled text | `--btn-primary-disabled-text` | `--color-text-inactive-light` | `--color-text-inactive-light` |

#### Secondary

| State | Token | Light value | Dark value |
|---|---|---|---|
| Background | `--btn-secondary-bg` | `--color-neutral-50` | `--color-opacity-white-16` |
| Text | `--btn-secondary-text` | `--color-text-primary-light` | `--color-text-primary-dark` |
| Hover BG | `--btn-secondary-bg-hover` | `--color-surface-inactive` | `--color-opacity-white-12` |
| Hover text | `--btn-secondary-text-hover` | `--color-text-primary-light` | `--color-text-primary-dark` |
| Disabled BG | `--btn-secondary-disabled-bg` | `--color-surface-inactive` | `--color-opacity-white-16` |
| Disabled text | `--btn-secondary-disabled-text` | `--color-text-inactive-light` | `--color-text-inactive-dark` |

#### Tertiary

| State | Token | Light value | Dark value |
|---|---|---|---|
| Border | `--btn-tertiary-border` | `--color-neutral-500` | `--color-opacity-white-40` |
| Text | `--btn-tertiary-text` | `--color-text-primary-light` | `--color-text-primary-dark` |
| Hover border | `--btn-tertiary-border-hover` | `--color-neutral-400` | `--color-opacity-white-26` |
| Hover text | `--btn-tertiary-text-hover` | `--color-text-tertiary-light` | `--color-text-primary-dark` |
| Disabled border | `--btn-tertiary-disabled-border` | `--color-neutral-200` | `--color-opacity-white-26` |
| Disabled text | `--btn-tertiary-disabled-text` | `--color-text-inactive-light` | `--color-text-inactive-dark` |

#### Text

| State | Token | Light value | Dark value |
|---|---|---|---|
| Text | `--btn-text-text` | `--color-text-primary-light` | `--color-text-primary-dark` |
| Hover text | `--btn-text-text-hover` | `--color-text-tertiary-light` | `--color-text-tertiary-dark` |
| Disabled text | `--btn-text-disabled-text` | `--color-text-inactive-light` | `--color-text-inactive-dark` |

### Navigation Bar
```
bg-neutral-800 rounded-pill p-1
```

### Section Headers
```
text-sm font-bold leading-heading tracking-tightest uppercase
```

### Section Descriptions
```
text-xs font-normal leading-body tracking-tighter text-text-subtle
```

## Custom Token Extensions (use these — do NOT recreate)

The following tokens are custom extensions defined in `@ucmp/ui-theme` via Tailwind 4's `@theme` directive. They generate valid utilities automatically. **Always use these existing tokens when building components — never create duplicates or inline alternatives.**

### Custom Font Size
| Utility | Token | Value | Use for |
|---|---|---|---|
| `text-2xs` | `--text-2xs` | 0.625rem (10px) | Disclaimers, fine print, copyright |
| `text-1.5xl` | `--text-1.5xl` | 1.375rem (22px) | Reserved Figma size (between base and 2xl) |

### Custom Line Heights
| Utility | Token | Value | Use for |
|---|---|---|---|
| `leading-heading` | `--leading-heading` | 1.05 | All headings (H1–H3), buttons, links, subheads |
| `leading-body` | `--leading-body` | 1.3 | All body text (XL, Large, Medium, Small, Disclaimer) |

### Custom Letter Spacing
| Utility | Token | Value | Use for |
|---|---|---|---|
| `tracking-tightest` | `--tracking-tightest` | -0.04em | Headings, buttons, links, subheads (Figma -4%) |
| `tracking-tighter` | `--tracking-tighter` | -0.02em | All body text (Figma -2%) |

> Note: `tracking-tighter` is redefined from Tailwind's default (-0.05em) to match the Figma design system (-0.02em).

### Custom Border Radii
| Utility | Token | Value | Use for |
|---|---|---|---|
| `rounded-3xl` | `--radius-3xl` | 1.875rem (30px) | Badges, tags |
| `rounded-4xl` | `--radius-4xl` | 2.5rem (40px) | Search prompts, slider tracks |
| `rounded-pill` | `--radius-pill` | 3.125rem (50px) | Navigation pills, pill-shaped containers |

### Custom Max Widths
| Utility | Token | Value | Use for |
|---|---|---|---|
| `max-w-8xl` | `--max-width-8xl` | 90rem (1440px) | Figma Large frame — page-level content cap |
| `max-w-hero-image` | `--max-width-hero-image` | 2556px | Hero/banner images at retina display widths |

### Design Decisions

- **H3 and Body-XL share 24px (`text-2xl`)** — differentiated by weight and line-height:
  - H3: `text-2xl font-bold leading-heading tracking-tightest`
  - Body-XL: `text-2xl font-normal leading-body tracking-tighter`

- **Figma spacing notation** — Figma uses `var(--1, 8px)`, `var(--4, 32px)` etc. Convert with: Figma unit × 8 = px, then px / 4 = Tailwind utility number. Example: Figma `5` → 40px → `p-10`.

- **Font family** — "Toyota Type" must be loaded via `next/font/local` in the app and exposed as `--font-app-sans`. The theme falls back to system sans-serif if not loaded.

- **OKLCH format** — All color tokens use OKLCH. Achromatic greys use `oklch(L 0 0)`. The one exception is `#585958` (Neutral/500) which has a barely perceptible green tint: `oklch(0.463 0.002 146.6)`.

### Intentionally Excluded

- **Safari browser chrome colors** — `Safari/Dark/Active` (#B5B5B5) and `Safari/Dark/Disabled` (#4D4D4D) are Figma variables for the browser mockup frame, not part of the design system.

- **`Styling/Inactive` (#C4C4C4)** — Mapped to `--color-neutral-300` and aliased as `--color-surface-inactive`. Matches Figma Neutral/300.

> **Note:** Primitive color tokens (neutrals, palettes, `-light`/`-dark` pairs) are defined in `base/tokens/colors.css`. Surface-aware semantic tokens (`text-primary`, `text-secondary`, `text-tertiary`, `text-inactive`, `divider`) are registered in `themes/<brand>/overrides/colors.css` and resolved at runtime via `data-surface` selectors in the same file. The values shown here reflect the **default theme** resolved output.
