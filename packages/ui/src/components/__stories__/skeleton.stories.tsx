import type { Meta, StoryObj } from "@storybook/react"

import { Skeleton } from "@/components/skeleton"

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A placeholder loading animation used to indicate content is being loaded. " +
          "Original shadcn implementation: [shadcn/ui Skeleton (Base)](https://ui.shadcn.com/docs/components/base/skeleton).",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    className: {
      control: "text",
      description: "Tailwind classes to control size and shape",
    },
  },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

// --- Basic shapes ---

export const Default: Story = {
  args: {
    className: "h-4 w-48",
  },
}

export const Circle: Story = {
  args: {
    className: "size-12 rounded-full",
  },
}

export const Square: Story = {
  args: {
    className: "size-12",
  },
}

export const LargeBanner: Story = {
  args: {
    className: "h-32 w-full",
  },
}

// --- Composed examples ---

export const CardPlaceholder: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-64">
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
}

export const UserProfile: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  ),
}

export const TextBlock: Story = {
  render: () => (
    <div className="flex flex-col gap-2 w-80">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  ),
}

export const FormPlaceholder: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-72">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  ),
}
