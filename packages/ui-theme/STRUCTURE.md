# Theme Package Structure

## Overview

The theme package is organized for maximum scalability and maintainability, with clear separation between base tokens, theme overrides, and color modes.

## Directory Structure

```
packages/ui-theme/
├── base/
│   ├── tokens/
│   │   ├── breakpoints.css    # Screen sizes and containers
│   │   ├── colors.css         # Base semantic colors
│   │   ├── radius.css         # Border radius scale
│   │   ├── shadows.css        # Shadow scale
│   │   ├── spacing.css        # Spacing scale
│   │   ├── sizes.css          # Width/max-width scale
│   │   ├── typography.css     # Font sizes, weights, line heights
│   │   └── index.css          # Barrel export + animations
│   └── index.css              # Base theme entry
│
├── themes/
│   ├── default/
│   │   ├── overrides/
│   │   │   ├── colors.css     # Brand color overrides (empty in default)
│   │   │   ├── typography.css # Font stack overrides
│   │   │   ├── radius.css     # Radius overrides (empty in default)
│   │   │   └── index.css      # Barrel export
│   │   ├── light.css          # Light mode colors
│   │   ├── dark.css           # Dark mode colors
│   │   └── index.css          # Default theme entry
│   │
│   └── acme/                  # Example branded theme (purple)
│       ├── overrides/
│       ├── light.css
│       ├── dark.css
│       └── index.css
│
├── utilities/
│   └── index.css              # Optional utility classes
│
├── index.css                  # Main entry (base only)
├── package.json               # Exports configuration
├── README.md                  # Usage documentation
└── STRUCTURE.md               # This file
```

## Theme Inheritance

```
Base Tokens (generic)
  ↓
Theme Overrides (brand-specific differences only)
  ↓
Light / Dark Modes (color schemes)
  ↓
shadcn Mapping (`:root` HSL variables → Tailwind utilities)
```

## Adding a new theme

### 1. Create the folder structure
```
themes/your-brand/
├── overrides/
│   ├── colors.css
│   ├── typography.css
│   ├── radius.css
│   └── index.css
├── light.css
├── dark.css
└── index.css
```

### 2. Override only what differs from base
```css
/* themes/your-brand/overrides/colors.css */
@theme {
  --color-primary: #ff6b00;
  --color-primary-foreground: #ffffff;
}
```

### 3. Define light/dark semantic colors
```css
/* themes/your-brand/light.css */
@theme {
  --color-primary: #ff6b00;
  /* … all semantic colors */
}
```

### 4. Register the export
```json
{
  "exports": {
    "./themes/your-brand": "./themes/your-brand/index.css"
  }
}
```

### 5. Use in your app
```css
@import "@ucmp/ui-theme/themes/your-brand";
```

## Design Principles

1. **Separation of concerns**: Base = generic, overrides = brand, light/dark = color modes.
2. **Override only what differs**: Themes inherit base and only define what's unique.
3. **shadcn-compatible**: All themes export the `--color-* ← --primary` mapping so the shadcn `:root` HSL pattern works out of the box.
4. **CSS-only**: No JavaScript runtime. Pure Tailwind v4 `@theme` blocks.
