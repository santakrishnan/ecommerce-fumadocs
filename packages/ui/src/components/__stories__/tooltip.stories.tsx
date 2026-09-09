import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "@/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/tooltip"

type TooltipStoryArgs = {
  surface: "light" | "dark"
  side: "top" | "right" | "bottom" | "left"
  align: "start" | "center" | "end"
  sideOffset: number
  alignOffset: number
  children: String
}

const meta: Meta<TooltipStoryArgs> = {
  title: "Components/Tooltip",
  tags: ["autodocs"],
  argTypes: {
    surface: {
      control: "select",
      options: ["light", "dark"],
    },
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
    },
    children: { control: "text" },
    sideOffset: { control: "number" },
    alignOffset: { control: "number" },
  },
  args: {
    surface: "light",
    side: "top",
    align: "center",
    sideOffset: 4,
    alignOffset: 0,
    children: "Magnetic Gray Metallic",
  },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="relative flex min-h-52 items-center justify-center overflow-hidden rounded-xl">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Tooltip>
      <TooltipTrigger render={<Button />}>Hover me</TooltipTrigger>
      <TooltipContent
        surface={args.surface}
        side={args.side}
        align={args.align}
        sideOffset={args.sideOffset}
        alignOffset={args.alignOffset}
      >
        {args.children}
      </TooltipContent>
    </Tooltip>
  ),
}
