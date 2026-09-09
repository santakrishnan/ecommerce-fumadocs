import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "@/components/button"
import { InputGroup, InputGroupInput } from "@/components/input-group"
import {
  Popover,
  PopoverBackdrop,
  PopoverContent,
  PopoverTrigger,
} from "@/components/popover"
import { IconArrowRight, IconLocation } from "@/icons"

/**
 * Popover Modal — a popover with an optional dark backdrop overlay.
 *
 * Use `PopoverBackdrop` to render a dark overlay behind the popover for
 * focused interactions like the Zip Code popup. The backdrop is fully
 * optional — omit it and the popover behaves like a standard light-dismiss
 * popover.
 *
 * Built on [Base UI Popover](https://base-ui.com/react/components/popover#api-reference).
 * Original shadcn implementation: [shadcn/ui Popover (Base)](https://ui.shadcn.com/docs/components/base/popover).
 */
const meta = {
  title: "Components/Popover Modal",
  component: Popover,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Popover with an optional modal backdrop. Use `PopoverBackdrop` to render a dark overlay behind the popover for focused interactions like the Zip Code popup. " +
          "Built on [Base UI Popover](https://base-ui.com/react/components/popover#api-reference). " +
          "Original shadcn implementation: [shadcn/ui Popover (Base)](https://ui.shadcn.com/docs/components/base/popover).",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger
        render={<Button variant="secondary">Open Popover</Button>}
      />
      <PopoverContent>
        <p className="text-sm">
          This is a standard popover without a backdrop. It behaves exactly as
          before — light dismiss, no overlay.
        </p>
      </PopoverContent>
    </Popover>
  ),
}

export const WithBackdrop: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger
        render={<Button variant="secondary">Open with Backdrop</Button>}
      />
      <PopoverBackdrop />
      <PopoverContent>
        <p className="text-sm">
          This popover has a dark overlay behind it. Click the backdrop or press
          Escape to dismiss.
        </p>
      </PopoverContent>
    </Popover>
  ),
}

export const ZipCodePopup: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="tertiary" size="sm" leadingIcon={IconLocation}>
            11249
          </Button>
        }
      />
      <PopoverBackdrop />
      <PopoverContent side="top" sideOffset={36} align="start">
        <div className="flex flex-col gap-4">
          {/* Helper text */}
          <div className="flex items-center gap-1">
            <IconLocation className="size-4 shrink-0" />
            <p className="text-xs leading-body tracking-tighter text-text-primary">
              Enter your ZIP code to see local inventory and pricing.
            </p>
          </div>

          {/* Zip code input */}
          <InputGroup className="border border-neutral-400">
            <InputGroupInput
              id="zip-change"
              placeholder="Zip Code"
              defaultValue="11249"
            />
          </InputGroup>

          {/* Current location link */}
          <button
            className="flex items-center gap-1 text-xs font-semibold leading-heading tracking-tightest text-text-primary"
            type="button"
          >
            Use my current location
            <IconArrowRight className="size-3" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  ),
}
