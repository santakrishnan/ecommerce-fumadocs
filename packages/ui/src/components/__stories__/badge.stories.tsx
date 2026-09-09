import type { Meta, StoryObj } from "@storybook/react"

import { Badge } from "@/components/badge"
import { IconCheckCircle, IconSaved } from "@/icons"

const meta = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "inverse"],
    },
  },
  args: {
    children: "Badge",
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const Inverse: Story = {
  args: { variant: "inverse" },
}

export const GoldCertified: Story = {
  args: {
    children: "Gold Certified",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Resize below and above the XL viewport (1870px) to verify responsive disclaimer typography and pill containment.",
      },
    },
  },
}

export const WithIconStart: Story = {
  args: {
    children: (
      <>
        <IconCheckCircle data-icon="inline-start" />
        Verified
      </>
    ),
  },
}

export const WithIconEnd: Story = {
  args: {
    children: (
      <>
        Bookmark
        <IconSaved data-icon="inline-end" />
      </>
    ),
  },
}

export const WithIconStartAndEnd: Story = {
  args: {
    children: (
      <>
        <IconCheckCircle data-icon="inline-start" className="text-brand" />
        Bookmark
        <IconSaved data-icon="inline-end" />
      </>
    ),
  },
}
