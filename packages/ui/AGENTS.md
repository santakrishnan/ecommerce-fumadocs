# AGENTS.md

AI agent guidance for `@ucmp/ui` — the shared component library built on Base UI.

## Package overview

This package ships shadcn-shaped primitives (`Dialog`, `Button`, `Card`, etc.) implemented on top of **`@base-ui/react`** (not Radix). Components are styled with Tailwind v4 utilities and CVA variants, themed via `@ucmp/ui-theme` tokens, and exported as named functions from barrel files.

## Do / Don't

### Component authoring

| Do | Don't |
| --- | --- |
| Use `@base-ui/react/<component>` as the underlying primitive | Import from `@radix-ui/*` or any Radix package |
| Use Base UI's dotted subcomponent API internally (`Dialog.Root`, `Dialog.Popup`, etc.) | Use the old `DialogPrimitive` naming from Radix |
| Use the `render` prop for composition (`<Trigger render={<Button />}>`) | Use the `asChild` prop — it does not exist in Base UI |
| Add `data-slot="<kebab-name>"` to **every** rendered element | Omit `data-slot` — it's used as a CSS/test hook |
| Export plain named functions (`function Button(...)`) | Export arrow functions, use `React.forwardRef`, or use `export default` — React 19 doesn't need forwardRef, and each file may export multiple related components |
| Accept `className` and spread `...props` on the root element | Hardcode classes without allowing override via `className` |
| Use `cn()` from `@/lib/utils` for conditional class merging | Concatenate strings with template literals or use `clsx` directly |
| Use CVA (`class-variance-authority`) for multi-variant components | Write `if/else` chains to build class strings |
| Add `"use client"` only when the component uses state, effects, event handlers, or browser APIs | Add `"use client"` to purely presentational/server-compatible components (e.g. `Card`) |
| Use semantic color tokens from the theme (`bg-primary`, `text-muted-foreground`, `border-input`) | Hardcode hex/HSL/OKLCH values or magic numbers in component code |
| Preserve existing validation, focus, hover, disabled, and error states (`aria-invalid`, `focus-visible`, `disabled:`, `data-*` selectors) even if specs/designs don't explicitly mention them | Remove or simplify interaction/validation states because the spec doesn't show them — they're still needed and will be updated later |
| Size icons with Tailwind `size-*` utilities | Set `width`/`height` props on SVGs |
| Use icons exclusively from `@ucmp/ui/icons` (brand icon set) | Import from `lucide-react` or any other icon library |

### Animations & transitions

| Do | Don't |
| --- | --- |
| Use Base UI data attributes for enter/exit animations (`data-open`, `data-closed`, `data-starting-style`, `data-ending-style`) | Use Radix `data-state="open"` attributes |
| Use Tailwind `animate-in`/`animate-out` utilities with data-attribute selectors | Reach for Framer Motion or `react-spring` |
| Define keyframes in `src/styles.css` under `@theme` if truly package-global | Scatter `@keyframes` across component files |

### Props conventions

Every component must define an explicit props interface and export it as a type:

```tsx
interface BadgeProps
  extends useRender.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {}

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: BadgeProps) {
  // ...
}

export { Badge }
export type { BadgeProps }
```

Rules:
- Name the interface `<Component>Props` (PascalCase, e.g. `ButtonProps`, `DialogContentProps`).
- Extend from `useRender.ComponentProps<"element">` (or the Base UI primitive's `.Props` type for wrapped primitives) plus `VariantProps<typeof variants>` when CVA is used.
- Export the props type at the bottom of the file with `export type { BadgeProps }`.
- Re-export the props type from `src/components/index.ts` as a type-only export:
  ```ts
  export type { BadgeProps } from "./badge";
  export type { PillGroupProps, PillProps } from "./pill";
  ```
- For compound components, each sub-component that consumers may extend should also get its own exported props interface (`DialogContentProps`, `SelectTriggerProps`, etc.) and be re-exported from the barrel.

### File & export conventions

| Do | Don't |
| --- | --- |
| One component (or compound-component set) per file in `src/components/` | Dump multiple unrelated components into one file |
| Name files `kebab-case.tsx` (`alert-dialog.tsx`, `number-field.tsx`) | Use PascalCase or camelCase file names |
| Re-export from `src/components/index.ts` immediately when adding a new component | Forget to add the export — consumers can't import it |
| Export props types from the barrel with `export type { FooProps }` | Forget to re-export the props type from `index.ts` |
| Keep CVA variant functions (`buttonVariants`, `tabsListVariants`, etc.) as internal implementation details | Export variant functions or style helpers (e.g. `navigationMenuTriggerStyle`, `pageGridVariants`) — consumers should not import raw styles |
| Export types with `export type` when they're type-only | Use value exports for pure types |
| Keep `src/index.ts` exporting only `./components`, `./hooks`, `./lib/utils` | Add direct file re-exports to the root barrel |

### Icons

| Do | Don't |
| --- | --- |
| Use icons from `@ucmp/ui/icons` for all icon needs | Import from `lucide-react`, `react-icons`, or any external icon package |
| Use the `createIcon` factory from `./icon-wrapper` when adding a new icon | Write raw `<svg>` components from scratch |
| Keep the 20×20 viewBox, `fill="none"`, `currentColor` stroke, and `aria-hidden` defaults | Change the viewBox or override color in the icon definition |
| Export the new icon from `src/icons/index.ts` | Create a separate barrel or forget the export |
| Name icons `Icon<PascalName>` (e.g. `IconBinocular`) | Drop the `Icon` prefix or use lowercase |
| If a needed icon doesn't exist, create it with `createIcon` and add it to the set | Pull in a third-party icon as a one-off import |

### Styling rules (aligns with `@ucmp/ui-theme`)

| Do | Don't |
| --- | --- |
| Use the Tailwind spacing scale (`p-4`, `gap-6`, `rounded-md`) | Use arbitrary pixel values (`p-[14px]`, `gap-[10px]`) |
| Use `px` only for borders, hairlines, and focus rings | Use `px` for spacing, typography, or sizing |
| Use token-based color references (`bg-surface-secondary`, `text-text-primary`) | Reference raw OKLCH/HSL values in classes |
| Split long `cn()`/`className` utility lists into grouped lines with brief section comments (see `input.tsx`, `pill.tsx` for examples) | Keep long utility lists as a single unreadable line |
| Keep `@apply` out of component code — inline utilities or CVA | Use `@apply`, CSS modules, or `styled-components` |

### Accessibility

| Do | Don't |
| --- | --- |
| Maintain the accessibility patterns inherited from shadcn (roles, aria attributes, focus management, keyboard navigation) | Strip accessibility attributes when converting from Radix to Base UI |
| Require `aria-label` on icon-only buttons | Render bare interactive icons without accessible labels |
| Always include a `DialogTitle` (even if visually hidden) for screen readers | Ship a Dialog without a title — ARIA requires it |
| Associate `Label` with its input via `htmlFor` / wrapping | Render disconnected labels that aren't programmatically linked |
| Flag when an accessibility pattern from the shadcn original may be missing after conversion | Silently drop accessibility features during Base UI migration |

### Storybook

| Do | Don't |
| --- | --- |
| Create a story file for every component (`<component>.stories.tsx`) | Ship a component without a corresponding story |
| Add a new story when a component gains new props or visual states | Leave story coverage stale after changes |
| Keep stories focused on demonstrating the component's core styles and states (default, variants, sizes, disabled, dark mode) | Build complex multi-component demos that obscure the component under test |
| Use stories as a QA tool — they should allow quick, accurate visual verification of component styles | Use stories only as documentation or marketing showcases |

### Testing

| Do | Don't |
| --- | --- |
| Co-locate tests in `__tests__/<component>.test.tsx` | Put tests in a top-level folder or alongside the component file |
| Use `@testing-library/react` + `@testing-library/user-event` | Use Enzyme or shallow rendering |
| Import test utilities from `@ucmp/vitest-config/test-utils` | Duplicate test setup across files |
| Test accessibility: rendered roles, aria attributes, keyboard interactions | Only test visual class presence |

## Adding a new component

1. Run `pnpm ui:add <name>` from the repo root (uses shadcn CLI with `style: "base-vega"`).
2. If the generated file uses Radix imports, swap them for `@base-ui/react/<primitive>` equivalents.
3. Ensure every rendered element has `data-slot="<kebab-name>"`.
4. Wire up variants with CVA if the component has more than one visual state.
5. Export from `src/components/index.ts`.
6. Update the README component inventory table if it's a new category.

## Path alias

Inside this package, `@/` resolves to `./src/`. Use it for all intra-package imports:

```ts
import { cn } from "@/lib/utils"
import { Button } from "@/components/button"
```

## Key dependencies

| Package | Purpose |
| --- | --- |
| `@base-ui/react` | Headless accessible primitives |
| `class-variance-authority` | Variant class generation |
| `tailwind-merge` + `clsx` | Class merging (`cn()`) |
| `lucide-react` | Legacy — only used inside existing components (CheckIcon, ChevronDown); new code should use `@ucmp/ui/icons` exclusively |
| `sonner` | Toast notifications |
| `embla-carousel-react` | Carousel engine |
| `input-otp` | OTP input primitive |
| `next-themes` | Theme switching (ThemeToggle) |
| `react-hook-form` + `zod` | Form state & validation (Field components) |

## Agent skills reference

Before modifying or creating components, activate the relevant skills:

| Skill | When to activate |
| --- | --- |
| `shadcn-baseui` | Any component work — enforces Base UI `render` prop, prevents Radix patterns |
| `shadcn-base` | When referencing shadcn docs, `useRender`, composition patterns, theming, or forms |
| `shadcn` | When using the shadcn CLI (`pnpm ui:add`), searching registries, or checking styling rules |

Skills live in `.agents/skills/` and provide detailed reference material (composition examples, props conventions, component lists, CLI docs). Always consult the relevant skill before guessing at a pattern.

## Common mistakes to watch for

- Importing from `@radix-ui/*` — this package uses Base UI exclusively.
- Importing icons from `lucide-react` — use `@ucmp/ui/icons` for all icons; if one is missing, create it with `createIcon`.
- Exporting CVA variant functions or style helpers (`buttonVariants`, `navigationMenuTriggerStyle`, etc.) — keep them internal to the component file; only export the component itself and its types.
- Using `asChild` — Base UI uses the `render` prop instead.
- Forgetting `data-slot` — breaks downstream CSS selectors and test queries.
- Using `React.forwardRef` — React 19 passes ref as a regular prop.
- Using `useContext()` / `<Context.Provider>` — use `use(Context)` / `<Context value={...}>`.
- Exporting with `export default` — all exports are named.
- Using `@apply` in component files — keep everything as inline Tailwind utilities or CVA.
- Adding `"use client"` to a component that doesn't need it — Card, Badge are pure Server Components.
- Removing existing validation/focus/hover/disabled/error state styles because the spec or design doesn't explicitly cover them — always preserve these; they'll be refined later.
