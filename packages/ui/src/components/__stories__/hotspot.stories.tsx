import type { Meta, StoryObj } from "@storybook/react"

import { Hotspot, HotspotContent, HotspotTrigger } from "@/components/hotspot"

type HotspotStoryArgs = {
  surface: "light" | "dark"
  side: "top" | "right" | "bottom" | "left"
  align: "start" | "center" | "end"
  sideOffset: number
  alignOffset: number
  label: string
  position: { top: string; left: string }
}

const meta: Meta<HotspotStoryArgs> = {
  title: "Components/Hotspot",
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
    sideOffset: { control: "number" },
    alignOffset: { control: "number" },
    label: { control: "text" },
    position: { control: "object" },
  },
  args: {
    surface: "light",
    side: "top",
    align: "center",
    sideOffset: 8,
    alignOffset: 0,
    label: "LED Daytime Running Lights",
    position: { top: "25%", left: "50%" },
  },
  decorators: [
    (Story) => (
      <div className="relative min-h-52 w-full overflow-hidden rounded-xl">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<HotspotStoryArgs>

export const Default: Story = {
  render: (args) => (
    <Hotspot>
      <HotspotTrigger aria-label={args.label} position={args.position} />
      <HotspotContent surface={args.surface} side={args.side} align={args.align} sideOffset={args.sideOffset} alignOffset={args.alignOffset}>
        {args.label}
      </HotspotContent>
    </Hotspot>
  ),
}

export const Selected: Story = {
  args: { label: "JBL premium audio" },
  render: (args) => (
    <Hotspot defaultOpen>
      <HotspotTrigger aria-label={args.label} position={args.position} />
      <HotspotContent surface={args.surface} side={args.side} align={args.align} sideOffset={args.sideOffset} alignOffset={args.alignOffset}>
        {args.label}
      </HotspotContent>
    </Hotspot>
  ),
}

export const PopupTop: Story = {
  args: { side: "top", label: "Panoramic moonroof" },
  render: (args) => (
    <Hotspot>
      <HotspotTrigger aria-label={args.label} position={args.position} />
      <HotspotContent side={args.side} align={args.align} sideOffset={args.sideOffset} alignOffset={args.alignOffset}>
        {args.label}
      </HotspotContent>
    </Hotspot>
  ),
}

export const PopupRight: Story = {
  args: { side: "right", label: "19-inch alloy wheels" },
  render: (args) => (
    <Hotspot>
      <HotspotTrigger aria-label={args.label} position={args.position} />
      <HotspotContent surface="light" side={args.side} align={args.align} sideOffset={args.sideOffset} alignOffset={args.alignOffset}>
        {args.label}
      </HotspotContent>
    </Hotspot>
  ),
}

export const PopupBottom: Story = {
  args: { side: "bottom", label: "Signature front grille" },
  render: (args) => (
    <Hotspot>
      <HotspotTrigger aria-label={args.label} position={args.position} />
      <HotspotContent surface="light" side={args.side} align={args.align} sideOffset={args.sideOffset} alignOffset={args.alignOffset}>
        {args.label}
      </HotspotContent>
    </Hotspot>
  ),
}

export const PopupLeft: Story = {
  args: { side: "left", label: "Integrated rear spoiler" },
  render: (args) => (
    <Hotspot>
      <HotspotTrigger aria-label={args.label} position={args.position} />
      <HotspotContent surface="light" side={args.side} align={args.align} sideOffset={args.sideOffset} alignOffset={args.alignOffset}>
        {args.label}
      </HotspotContent>
    </Hotspot>
  ),
}

export const OnImage: Story = {
  name: "On image",
  args: {
    surface: "light",
  },
  decorators: [
    (Story) => (
      <div className="relative w-full overflow-hidden rounded-xl bg-neutral-100">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <>
      {/* biome-ignore lint/a11y/useAltText: decorative story image */}
      <img
        src="/images/mock-car-image.jpg"
        alt="Mock car"
        className="block h-auto w-full"
      />

      <Hotspot>
        <HotspotTrigger aria-label="LED Daytime Running Lights" position={{ top: "55%", left: "65%" }} />
        <HotspotContent surface={args.surface} side="top">
          LED Daytime Running Lights
        </HotspotContent>
      </Hotspot>

      <Hotspot>
        <HotspotTrigger aria-label="18-inch alloy wheels" position={{ top: "72%", left: "42%" }} />
        <HotspotContent surface={args.surface} side="bottom">
          18-inch alloy wheels
        </HotspotContent>
      </Hotspot>

      <Hotspot>
        <HotspotTrigger aria-label="Panoramic glass roof" position={{ top: "26%", left: "44%" }} />
        <HotspotContent surface={args.surface} side="top">
          Panoramic glass roof
        </HotspotContent>
      </Hotspot>

      <Hotspot defaultOpen>
        <HotspotTrigger aria-label="Sport front grille" position={{ top: "60%", left: "76%" }} />
        <HotspotContent surface={args.surface} side="left">
          Sport front grille
        </HotspotContent>
      </Hotspot>
    </>
  ),
}

