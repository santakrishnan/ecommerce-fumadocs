# Design Token Workflow — Figma → Tailwind 4 → Components

A step-by-step guide for using the Figma MCP integration to extract design tokens, validate them against the `@ucmp/ui-theme` package, and ensure proper Tailwind 4 mapping **before** building any components.

---

## Why Tokens First?

Building components without validated tokens leads to:
- Hardcoded colors (`#9e9e9e`) instead of semantic utilities (`text-text-muted`)
- Inconsistent spacing across pages
- Duplicate custom values that drift from the design system
- Responsive breakpoints that don't match Figma frames

**Rule: Always validate tokens before writing component code.**

---

## Prerequisites

1. **Figma Desktop** running with Dev Mode MCP server enabled
2. **MCP config** at `.kiro/settings/mcp.json`:
   ```json
   {
     "mcpServers": {
       "Figma Desktop": {
         "url": "http://127.0.0.1:3845/mcp",
         "disabled": false,
         "autoApprove": []
       }
     }
   }
   ```
3. **Figma file open** in Dev Mode with the target frame selected

---

## Step 1: Extract Variables from Figma

Use the Figma MCP `get_variable_defs` tool with the node ID from the Figma URL.

**How to get the node ID:** From `?node-id=1-4155`, the node ID is `1:4155` (replace `-` with `:`).

### Prompt Template

```
Get the variable definitions for this Figma node:
@https://www.figma.com/design/<fileKey>/<fileName>?node-id=<nodeId>&m=dev
```

### What you get back

A JSON object with:
- **Spacing variables**: `"1": "8"`, `"2": "16"`, `"4": "32"` etc.
- **Color variables**: `"Text/Black": "#000000"`, `"Styling/White": "#ffffff"` etc.
- **Typography size variables**: `"typography/h1": "32"`, `"typography/Body-Medium": "14"` etc.
- **Typography style definitions**: Full font specs with family, weight, size, lineHeight, letterSpacing

---

## Step 2: Get Design Context (Component Structure)

Use `get_design_context` to see the generated code and understand which CSS variables the components reference.

### Prompt Template

```
Get the design context for this Figma node:
@https://www.figma.com/design/<fileKey>/<fileName>?node-id=<nodeId>&m=dev
```

### What to look for

- `var(--N, Npx)` patterns → spacing tokens
- `var(--text/black, black)` → color tokens
- `var(--typography/body-medium, 14px)` → font size tokens
- `font-['Toyota_Type:Bold']` → font family/weight
- `leading-[1.05]` / `tracking-[-0.56px]` → line-height/letter-spacing

---

## Step 3: Get Frame Metadata (Breakpoints)

Use `get_metadata` to check the frame dimensions for breakpoint mapping.

### Prompt Template

```
Get the metadata for this Figma node to check frame dimensions:
@https://www.figma.com/design/<fileKey>/<fileName>?node-id=<nodeId>&m=dev
```

### Breakpoint mapping

| Figma Frame Width | Tailwind Prefix | Token | Usage |
|---|---|---|---|
| 393px | (default) | `--breakpoint-sm` | Mobile-first base |
| 768px | `md:` | `--breakpoint-md` | Tablet |
| 1440px | `lg:` | `--breakpoint-lg` | Desktop |
| 1870px | `xl:` | `--breakpoint-xl` | Wide desktop |

---

## Step 4: Cross-Reference Against Existing Tokens

Compare every Figma variable against the files in `packages/ui-theme/base/tokens/`:

| File | What to check |
|---|---|
| `colors.css` | All color hex values have OKLCH equivalents |
| `typography.css` | All font sizes exist in `--text-*` scale |
| `spacing.css` | All spacing values exist in `--spacing-*` scale |
| `radius.css` | All border-radius values exist in `--radius-*` scale |

### Validation checklist

- [ ] Every Figma color variable maps to an existing `--color-*` token
- [ ] Every Figma font size maps to an existing `--text-*` token
- [ ] Every Figma spacing value maps to an existing `--spacing-*` token
- [ ] Line-heights map to `--leading-heading` (1.05) or `--leading-body` (1.3)
- [ ] Letter-spacing maps to `--tracking-tightest` (-0.04em) or `--tracking-tighter` (-0.02em)
- [ ] Border radii map to existing `--radius-*` tokens
- [ ] No new variables are needed (or if they are, add them to base tokens)

---

## Step 5: Check All Breakpoints

Repeat Steps 1–4 for **every breakpoint frame** of the same page:
- Mobile (393px)
- Tablet (768px)
- Desktop (1440px)
- Wide (1870px)

### What to validate across breakpoints

1. **Are the same tokens used?** (Usually yes — only layout changes)
2. **Does typography change size?** (Rare — document if it does)
3. **Are there new color/spacing variables?** (Add to base if missing)

### Known responsive patterns

| Pattern | Mobile/Tablet | Desktop | Tailwind |
|---|---|---|---|
| H1 (returning user) | 28px | 32px | `text-3xl xl:text-4xl` |
| Large Numbers (returning user) | 48px | 56px | `text-5xl xl:text-6xl` |
| H1 (new user) | 32px | 32px | `text-4xl` (no change) |

---

## Step 6: Add Missing Tokens (if any)

If a Figma variable doesn't map to an existing token:

1. **Add to `packages/ui-theme/base/tokens/<category>.css`** inside `@theme {}`
2. **Use OKLCH for colors** — convert hex with proper lightness/chroma/hue
3. **Use rem for sizes** — divide px by 16
4. **Follow naming conventions**:
   - Colors: `--color-<category>-<name>` (e.g., `--color-neutral-300`)
   - Typography: `--text-<size>` (e.g., `--text-2xs`)
   - Spacing: `--spacing-<number>` (e.g., `--spacing-16`)
   - Radius: `--radius-<name>` (e.g., `--radius-pill`)
5. **Update `docs/FIGMA-TOKEN-MAPPING.md`** with the new mapping
6. **Update theme overrides** if the token is brand-specific

---

## Step 7: Document and Commit

Before building components:

1. Update `docs/FIGMA-TOKEN-MAPPING.md` with any new findings
2. Commit token changes: `feat(ui-theme): add <description> tokens`
3. Push to repo so other team members have the tokens available

---

## Quick Reference: Figma → Tailwind Utility

### Typography

| Figma Style | Tailwind Classes |
|---|---|
| H1 - Bold (32px) | `text-4xl font-bold leading-heading tracking-tightest` |
| H2 (28px) | `text-3xl font-bold leading-heading tracking-tightest` |
| H3 (24px) | `text-2xl font-bold leading-heading tracking-tightest` |
| Subhead (16px) | `text-base font-semibold leading-heading tracking-tightest` |
| Body - XL (24px) | `text-2xl font-normal leading-body tracking-tighter` |
| Body - Large (16px) | `text-base font-normal leading-body tracking-tighter` |
| Body - Medium (14px) | `text-sm font-normal leading-body tracking-tighter` |
| Body - Small (12px) | `text-xs font-normal leading-body tracking-tighter` |
| Disclaimer (10px) | `text-2xs font-normal leading-body tracking-tighter` |
| Large Numbers (56px) | `text-6xl font-bold leading-heading tracking-tightest` |
| Button Text (14px) | `text-sm font-semibold leading-heading tracking-tightest` |
| Link Text (12px) | `text-xs font-semibold leading-heading tracking-tightest` |

### Colors

| Figma Variable | Tailwind Utility |
|---|---|
| `Text/Black` | `text-text-primary` |
| `Text/White` | `text-text-inverse` |
| `Text/Grey` | `text-text-muted` |
| `Styling/Grey Dark` | `text-text-subtle` |
| `Styling/White` | `bg-surface-primary` |
| `Styling/Grey light` | `bg-surface-secondary` |
| `Black` / `Neutral/800` | `bg-surface-dark` |
| `Styling/Inactive` | `bg-surface-inactive` |
| `Styling/Brand red` | `bg-brand` / `text-brand` |

### Spacing (Figma unit → Tailwind)

Formula: **Figma unit × 8 = px**, then **px / 4 = Tailwind number**

| Figma | px | Tailwind |
|---|---|---|
| 0.5 | 4 | `p-1` / `gap-1` |
| 1 | 8 | `p-2` / `gap-2` |
| 1.5 | 12 | `p-3` / `gap-3` |
| 2 | 16 | `p-4` / `gap-4` |
| 2.5 | 20 | `p-5` / `gap-5` |
| 3 | 24 | `p-6` / `gap-6` |
| 4 | 32 | `p-8` / `gap-8` |
| 5 | 40 | `p-10` / `gap-10` |
| 6 | 48 | `p-12` / `gap-12` |
| 7 | 56 | `p-14` / `gap-14` |
| 8 | 64 | `p-16` / `gap-16` |
| 10 | 80 | `p-20` / `gap-20` |

### Border Radius

| Figma Usage | Tailwind |
|---|---|
| Cards | `rounded-xl` |
| Large panels | `rounded-2xl` |
| Badges | `rounded-3xl` |
| Search prompts | `rounded-4xl` |
| Nav pills | `rounded-pill` |
| Buttons | `rounded-full` |

---

## Example: Full Workflow for a New Page

```
1. "Get variable definitions for node 1:4155"
   → Extract all spacing, colors, typography variables

2. "Get design context for node 1:4155"
   → See component structure and CSS variable usage

3. "Get metadata for node 1:4155"
   → Confirm frame is 1440px (desktop breakpoint)

4. Cross-reference against packages/ui-theme/base/tokens/
   → All variables covered? If not, add missing tokens.

5. Repeat for tablet (node 1:4101), desktop (node 1:4155), and wide (node 1:4200)
   → Same tokens? Any responsive typography differences?

6. Commit token updates: "feat(ui-theme): add tokens for <page>"

7. NOW build components using the validated token utilities.
```

---

## Anti-Patterns (Don't Do This)

| ❌ Don't | ✅ Do Instead |
|---|---|
| `text-[#9e9e9e]` | `text-text-muted` |
| `text-[14px]` | `text-sm` |
| `leading-[1.05]` | `leading-heading` |
| `tracking-[-0.56px]` | `tracking-tightest` |
| `rounded-[16px]` | `rounded-xl` |
| `p-[32px]` | `p-8` |
| `gap-[80px]` | `gap-20` |
| `bg-[#e6e6e6]` | `bg-surface-secondary` |
| Create new `--my-custom-color` | Use existing `--color-neutral-*` |

---

## Files Reference

| File | Purpose |
|---|---|
| `packages/ui-theme/base/tokens/colors.css` | All color tokens (OKLCH) |
| `packages/ui-theme/base/tokens/typography.css` | Font sizes, weights, line-heights, letter-spacing |
| `packages/ui-theme/base/tokens/spacing.css` | Spacing scale |
| `packages/ui-theme/base/tokens/radius.css` | Border radius scale |
| `packages/ui-theme/base/tokens/breakpoints.css` | Responsive breakpoints |
| `packages/ui-theme/themes/default/overrides/colors.css` | Brand color overrides |
| `packages/ui-theme/themes/default/overrides/typography.css` | Font family override |
| `docs/FIGMA-TOKEN-MAPPING.md` | Complete Figma → Tailwind reference |
