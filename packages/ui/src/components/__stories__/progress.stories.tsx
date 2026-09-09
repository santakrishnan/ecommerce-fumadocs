import type { Meta, StoryObj } from "@storybook/react"

import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/progress"
import type { ProgressProps } from "@/components/progress"

const DEFAULT_PROGRESS_ARGS = {
  value: 50,
} satisfies ProgressProps

const meta = {
  title: "Components/Progress",
  component: Progress,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: DEFAULT_PROGRESS_ARGS,
}

export const WithLabelAndValue: Story = {
  render: () => (
    <Progress value={50}>
      <ProgressLabel>Profile completion</ProgressLabel>
      <ProgressValue />
    </Progress>
  ),
}

export const MultipleValues: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-4">
      <Progress value={0} />
      <Progress value={50} />
      <Progress value={100} />
    </div>
  ),
}
