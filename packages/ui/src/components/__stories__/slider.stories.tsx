import type { Meta, StoryObj } from "@storybook/react"

import { Slider } from "@/components/slider"

const meta = {
  title: "Components/Slider",
  component: Slider,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A slider built on [Base UI Slider](https://base-ui.com/react/components/slider#api-reference). " +
          "Original shadcn implementation: [shadcn/ui Slider (Base)](https://ui.shadcn.com/docs/components/base/slider).",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    min: { control: { type: "number" } },
    max: { control: { type: "number" } },
    step: { control: { type: "number" } },
    disabled: { control: "boolean" },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
  args: {
    min: 0,
    max: 100,
    defaultValue: [50],
    disabled: false
  },
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const CustomStep: Story = {
  args: { defaultValue: [25], step: 25 },
}

export const Disabled: Story = {
  args: { defaultValue: [40], disabled: true },
}

export const Vertical: Story = {
  args: { defaultValue: [30], orientation: "vertical" },
  decorators: [
    (Story) => (
      <div className="h-60">
        <Story />
      </div>
    ),
  ],
}

export const Range: Story = {
  args: { defaultValue: [20, 80] },
}
