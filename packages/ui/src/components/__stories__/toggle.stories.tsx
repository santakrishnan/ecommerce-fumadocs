import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { expect, fn, userEvent, within } from "storybook/test"

import { Toggle } from "@/components/toggle"
import { IconHeart, IconHeartFilled, IconSaved, IconSavedFilled } from "@/icons"

const meta = {
  title: "Components/Toggle",
  component: Toggle,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A toggle button built on [Base UI Toggle](https://base-ui.com/react/components/toggle). " +
          "Original shadcn implementation: [shadcn/ui Toggle (Base)](https://ui.shadcn.com/docs/components/base/toggle). " +
          "Supports two patterns: Save Search (text + icon, pill) and Inventory Save (icon-only, frosted glass circle).",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      table: { disable: true },
    },
    disabled: {
      control: "boolean",
      description: "Disables the toggle",
    },
    className: {
      control: "text",
      description: "Consumer-applied classes (e.g. text color)",
    },
  },
  args: {
    variant: "default",
    disabled: false,
  },
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

// --- Default variant (Save Search — text + icon) ---

export const Default: Story = {
  render: (args) => (
    <Toggle {...args}>
      Save search
      <IconHeart />
    </Toggle>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const toggle = canvas.getByRole("button")

    await expect(toggle).toBeInTheDocument()
    await expect(toggle).toHaveAttribute("aria-pressed", "false")

    await userEvent.click(toggle)
    await expect(toggle).toHaveAttribute("aria-pressed", "true")
  },
}

export const Pressed: Story = {
  args: { defaultPressed: true },
  render: (args) => (
    <Toggle {...args}>
      Save search
      <IconHeart />
    </Toggle>
  ),
}

export const OnDarkSurface: Story = {
  args: { },
  render: (args) => (
    <Toggle {...args}>
      Save search
      <IconHeart />
    </Toggle>
  ),
  decorators: [
    (Story) => (
      <div data-surface="dark" className="rounded-2xl bg-neutral-700 p-8">
        <Story />
      </div>
    ),
  ],
}

export const OnLightSurface: Story = {
  args: { },
  render: (args) => (
    <Toggle {...args}>
      Save search
      <IconHeart />
    </Toggle>
  ),
  decorators: [
    (Story) => (
      <div data-surface="light" className="rounded-2xl bg-neutral-100 p-8">
        <Story />
      </div>
    ),
  ],
}

// --- Icon variant (Inventory Save — icon-only) ---

export const IconDefault: Story = {
  args: { variant: "icon" },
  render: (args) => (
    <Toggle {...args} aria-label="Save to watchlist">
      <IconSaved />
    </Toggle>
  ),
  decorators: [
    (Story) => (
      <div className="rounded-2xl bg-neutral-200 p-8">
        <Story />
      </div>
    ),
  ],
}

export const IconPressed: Story = {
  args: { variant: "icon", defaultPressed: true },
  render: (args) => (
    <Toggle {...args} aria-label="Save to watchlist">
      <IconSaved />
    </Toggle>
  ),
  decorators: [
    (Story) => (
      <div className="rounded-2xl bg-neutral-200 p-8">
        <Story />
      </div>
    ),
  ],
}

export const IconMobile: Story = {
  args: { variant: "icon" },
  render: (args) => (
    <Toggle {...args} aria-label="Save to watchlist">
      <IconSaved />
    </Toggle>
  ),
  decorators: [
    (Story) => (
      <div className="rounded-2xl bg-neutral-200 p-8">
        <Story />
      </div>
    ),
  ],
}

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <Toggle {...args}>
      Save search
      <IconHeart />
    </Toggle>
  ),
}

export const FocusVisible: Story = {
  args: { },
  render: (args) => (
    <Toggle {...args}>
      Save search
      <IconHeart />
    </Toggle>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Focus ring appears on keyboard navigation (`focus-visible:ring-2 focus-visible:ring-ring/50`). Tab to the toggle to see the ring.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="rounded-2xl bg-neutral-100 p-8">
        <p className="mb-4 text-xs text-neutral-500">
          Press Tab to focus the toggle and see the focus ring.
        </p>
        <Story />
      </div>
    ),
  ],
}

// --- Controlled (interactive with state sync) ---

export const Controlled: Story = {
  args: { variant: "default", onPressedChange: fn() },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "icon"],
      description: "Visual style variant",
      table: { disable: false },
    },
    pressed: {
      control: "boolean",
      description: "Controlled pressed state",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Fully controlled toggle that syncs with Storybook controls. Icons and labels swap based on pressed state.",
      },
    },
  },
  render: (args) => {
    const isIcon = args.variant === "icon"
    const [pressed, setPressed] = React.useState(args.pressed ?? false)

    React.useEffect(() => {
      setPressed(args.pressed ?? false)
    }, [args.pressed])

    if (isIcon) {
      return (
        <Toggle
          aria-label={pressed ? "Remove from watchlist" : "Save to watchlist"}
          variant={args.variant}
          disabled={args.disabled}
          className={args.className}
          pressed={pressed}
          onPressedChange={(value, event) => {
            setPressed(value)
            args.onPressedChange?.(value, event)
          }}
        >
          {pressed ? <IconSavedFilled /> : <IconSaved />}
        </Toggle>
      )
    }

    return (
      <Toggle
        variant={args.variant}
        disabled={args.disabled}
        className={args.className}
        pressed={pressed}
        onPressedChange={(value, event) => {
          setPressed(value)
          args.onPressedChange?.(value, event)
        }}
      >
        {pressed ? "Search saved" : "Save search"}
        {pressed ? <IconHeartFilled /> : <IconHeart />}
      </Toggle>
    )
  },
}
