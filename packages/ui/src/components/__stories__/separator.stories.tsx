import type { Meta, StoryObj } from "@storybook/react"

import { Separator } from "@/components/separator"

/**
 * Separator — a visual divider between content sections.
 *
 * Renders a horizontal or vertical line using the `bg-divider` token.
 */
const meta = {
  title: "Components/Separator",
  component: Separator,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A visual divider that separates content. Supports horizontal and vertical orientations.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

/** Default horizontal separator. */
export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm">Content above</p>
      <Separator />
      <p className="text-sm">Content below</p>
    </div>
  ),
}

/** Vertical separator between inline elements. */
export const Vertical: Story = {
  render: () => (
    <div className="flex h-10 items-center gap-4">
      <span className="text-sm">Left</span>
      <Separator orientation="vertical" />
      <span className="text-sm">Right</span>
    </div>
  ),
}

/** Multiple separators in a list layout. */
export const InList: Story = {
  render: () => (
    <div className="flex flex-col">
      <p className="py-3 text-sm">Item 1</p>
      <Separator />
      <p className="py-3 text-sm">Item 2</p>
      <Separator />
      <p className="py-3 text-sm">Item 3</p>
    </div>
  ),
}
