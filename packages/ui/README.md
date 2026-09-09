# @ucmp/ui

Shared React component library for the UCMP monorepo. Shadcn-style primitives reimplemented on top of **Base UI** (`@base-ui/react`) instead of Radix.

## Why Base UI?

[Base UI](https://base-ui.com/) is the modern, headless, unstyled component library by the original creators of Radix UI and MUI. It exposes the same accessibility guarantees with a cleaner API (`Dialog.Root` / `Dialog.Popup` / `Dialog.Backdrop` etc.), better data attributes for styling (`data-starting-style` / `data-ending-style`), and improved composability.

## Installation in a monorepo app

```json
{
  "dependencies": {
    "@ucmp/ui": "workspace:*"
  }
}
```

Then make sure your app imports the package styles:

```css
/* apps/web/src/app/globals.css */
@import "@ucmp/ui/styles.css";
```

## Usage

```tsx
import { Button, Card, CardContent, Dialog, DialogContent, DialogTrigger } from "@ucmp/ui";

export function Example() {
  return (
    <Dialog>
      <DialogTrigger render={<Button>Open</Button>} />
      <DialogContent>Hello</DialogContent>
    </Dialog>
  );
}
```

## Breaking Changes

- `Badge` no longer exposes the `subtle` variant. The public variant API is now `default` and `inverse` only. A repo-wide search found no direct production usages of the primitive outside Storybook; the shared app badge wrapper flows through `CardBadge`.

## Component inventory

| Category | Components |
| --- | --- |
| Overlays | `Dialog`, `AlertDialog`, `Popover`, `Tooltip`, `DropdownMenu`, `Menubar`, `NavigationMenu` |
| Form controls | `Button`, `Input`, `Textarea`, `Label`, `Checkbox`, `RadioGroup`, `Switch`, `Slider`, `Select`, `NumberField`, `Toggle`, `ToggleGroup`, `Form` |
| Disclosure | `Accordion`, `Collapsible`, `Tabs` |
| Display | `Card`, `Badge`, `Chip`, `Avatar`, `Progress`, `Separator`, `Skeleton` |
| Navigation | `Breadcrumb`, `Pagination`, `Carousel` |
| Layout | `PageGrid` |
| Feedback | `Toaster` (Sonner), `toast` |

## Icons

Custom brand icons are shipped as inline SVG React components. They are tree-shakeable, SSR-compatible, and themeable via Tailwind `text-*` utilities.

### Import

```tsx
import { IconHome, IconCar, IconSearch } from "@ucmp/ui/icons";
```

### Usage

```tsx
<IconHome className="size-5 text-text-primary" />
<IconCar className="size-6 text-brand" />
<IconSearch className="size-4 text-text-muted" />
```

### Sizing

Use Tailwind's `size-*` utilities (rem-based). Do not use `width`/`height` props.

```tsx
{/* ✅ Correct */}
<IconHome className="size-5" />

{/* ❌ Wrong */}
<IconHome width={20} height={20} />
```

### Theming

Icons use `currentColor` — they inherit the text color from their parent or from a `text-*` class:

```tsx
<button className="text-text-primary hover:text-brand">
  <IconHeart className="size-5" />
</button>
```

### Available icons (49)

`IconAdd`, `IconArrowDown`, `IconArrowLeft`, `IconArrowReturnRight`, `IconArrowRight`, `IconArrowUp`, `IconBinocular`, `IconBrain`, `IconCalendar`, `IconCamera`, `IconCar`, `IconCarSide`, `IconCaretDown`, `IconCaretLeft`, `IconCaretRight`, `IconCaretUp`, `IconCheckCircle`, `IconCheckmark`, `IconClose`, `IconCompare`, `IconContract`, `IconDocument`, `IconDocumentFilled`, `IconFilter`, `IconGrid`, `IconHeart`, `IconHeartFilled`, `IconHome`, `IconHomeFilled`, `IconLocation`, `IconMic`, `IconPause`, `IconPhotos`, `IconPlay`, `IconPreferences`, `IconPriceTag`, `IconPriceTagFilled`, `IconProfile`, `IconProfileFilled`, `IconSaveAdd`, `IconSaved`, `IconSavedFilled`, `IconScreencast`, `IconSearch`, `IconSearchContext`, `IconSend`, `IconSquaresFour`, `IconSwitch`, `IconTool`

### Adding a new icon

1. Create `packages/ui/src/icons/my-icon.tsx`:

   ```tsx
   import { createIcon } from "./icon-wrapper";

   export const IconMyIcon = createIcon(
     "IconMyIcon",
     <path d="..." stroke="currentColor" strokeWidth={1.5} fill="none" />
   );
   ```

2. Export from `packages/ui/src/icons/index.ts`:

   ```tsx
   export { IconMyIcon } from "./my-icon";
   ```

## Adding a shadcn component

Run from the repo root:
```bash
pnpm ui:add <component-name>
```

This adds the official shadcn (`new-york` style) component into `packages/ui/src/components/`. **Note:** shadcn-generated code uses Radix imports — you'll need to swap them out for the Base UI equivalents (or pick the `base-ui` variant of shadcn when prompted). See the existing components in this package for the conversion pattern.

## Path alias

Inside this package, components import via `@/` (resolves to `./src/`). The alias is configured in `tsconfig.json` and `components.json`.
