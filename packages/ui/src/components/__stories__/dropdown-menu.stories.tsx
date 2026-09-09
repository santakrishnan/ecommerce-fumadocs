import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@/components/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/dropdown-menu"

/**
 * DropdownMenu — a menu of actions/options triggered by a button, built on Base UI.
 *
 * The trigger uses the **render approach** to compose with the existing primary
 * `Button` component — no new trigger-specific visual tokens are introduced.
 * All interactive states (default, hover, focus-visible, open, disabled) are
 * inherited from the Button variant.
 *
 * ### Styling Summary
 *
 * | Subcomponent | Styling |
 * |---|---|
 * | **Content** | `bg-surface-primary`, 16px radius, 8px padding, min-w 168px, `shadow-dropdown` |
 * | **Item** | 16px vertical / 20px horizontal padding, `text-xs leading-body tracking-tighter`, hover `bg-secondary` |
 * | **Separator** | 1px height, `bg-surface-secondary`, no negative margin (respects content padding) |
 * | **CheckboxItem** | Same as Item, `data-checked` `bg-secondary`, no checkmark icon |
 * | **RadioItem** | Same as Item, `data-checked` `bg-secondary`, no checkmark icon |
 */
const meta = {
  title: "Components/DropdownMenu",
  component: DropdownMenu,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A dropdown menu of actions/options triggered by a button, built on [Base UI Menu](https://base-ui.com/react/components/menu). " +
          "Original shadcn implementation: [shadcn/ui Dropdown Menu (Base)](https://ui.shadcn.com/docs/components/base/dropdown-menu). " +
          "Trigger visuals are composed via the render approach using the existing primary Button variant.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default dropdown with basic menu items.
 * Trigger composes with the primary `Button` via the `render` prop.
 */
export const Default: Story = {
  args: {
    fullWidthItems: false,
  },
  argTypes: {
    fullWidthItems: {
      control: "boolean",
      description: "Remove content padding so all item backgrounds span edge-to-edge",
    },
  },
  render: (args: any) => (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="primary" trailingIcon={ChevronDownIcon}>
            Options
          </Button>
        }
      />
      <DropdownMenuContent fullWidthItems={args.fullWidthItems}>
        <DropdownMenuGroup>
          <DropdownMenuItem>Item one</DropdownMenuItem>
          <DropdownMenuItem>Item two</DropdownMenuItem>
          <DropdownMenuItem>Item three</DropdownMenuItem>
          <DropdownMenuItem>Item four</DropdownMenuItem>
          <DropdownMenuItem>Item five</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
} as any

/**
 * ## DropdownMenuSeparator
 *
 * A 1px divider (`bg-surface-secondary`) that spans the content width while
 * respecting the 8px padding set by `DropdownMenuContent`. Place between
 * items as needed — it is consumer-driven (not automatic).
 */

/**
 * RadioItem — single-select. Selected item shows `bg-secondary`
 * background, no checkmark icon. Only one item can be active at a time.
 */
export const RadioItems: Story = {
  args: {
    fullWidthItems: false,
  },
  argTypes: {
    fullWidthItems: {
      control: "boolean",
      description: "Remove content padding so all item backgrounds span edge-to-edge",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "**DropdownMenuRadioItem** — Single-select. Selected item shows `bg-secondary` background, no checkmark icon. " +
          "Only one item can be active at a time. `DropdownMenuSeparator` is placed between items.",
      },
    },
  },
  render: (args: any) => {
    const [value, setValue] = React.useState("option-a")

    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="primary" trailingIcon={ChevronDownIcon}>
              Select
            </Button>
          }
        />
        <DropdownMenuContent fullWidthItems={args.fullWidthItems}>
          <DropdownMenuGroup>
            <DropdownMenuRadioGroup value={value} onValueChange={setValue}>
              <DropdownMenuRadioItem value="option-a">Option A</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              <DropdownMenuRadioItem value="option-b">Option B</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              <DropdownMenuRadioItem value="option-c">Option C</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              <DropdownMenuRadioItem value="option-d">Option D</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
} as any

/**
 * CheckboxItem — multi-select. Checked items show `bg-secondary`
 * background, no checkmark icon. Multiple items can be toggled independently.
 */
export const CheckboxItems: Story = {
  args: {
    fullWidthItems: false,
  },
  argTypes: {
    fullWidthItems: {
      control: "boolean",
      description: "Remove content padding so all item backgrounds span edge-to-edge",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "**DropdownMenuCheckboxItem** — Multi-select. Checked items show `bg-secondary` background, no checkmark icon. " +
          "Multiple items can be toggled independently. `DropdownMenuSeparator` is placed between items.",
      },
    },
  },
  render: (args: any) => {
    const [checkedA, setCheckedA] = React.useState(true)
    const [checkedB, setCheckedB] = React.useState(false)
    const [checkedC, setCheckedC] = React.useState(false)

    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="primary" trailingIcon={ChevronDownIcon}>
              Filter
            </Button>
          }
        />
        <DropdownMenuContent fullWidthItems={args.fullWidthItems}>
          <DropdownMenuGroup>
            <DropdownMenuCheckboxItem checked={checkedA} onCheckedChange={setCheckedA}>
              Option A
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={checkedB} onCheckedChange={setCheckedB}>
              Option B
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={checkedC} onCheckedChange={setCheckedC}>
              Option C
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
} as any

/**
 * FullWidthItems variant — content padding is removed so item backgrounds span edge-to-edge.
 * Useful when the menu should appear as a continuous action list.
 */
export const FullWidthItems: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "**fullWidthItems** — Removes `DropdownMenuContent` padding so item backgrounds can span edge-to-edge. " +
          "Items keep their standard internal padding while using square corners.",
      },
    },
  },
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="primary" trailingIcon={ChevronDownIcon}>
            Full Width Items
          </Button>
        }
      />
      <DropdownMenuContent fullWidthItems>
        <DropdownMenuGroup>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuItem>Move</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            Delete
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}
