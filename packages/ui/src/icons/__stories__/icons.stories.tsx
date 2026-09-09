import type { Meta, StoryObj } from "@storybook/react"

import * as AllIcons from "../index"
import type { Surface } from "../../lib/types"

const { createIcon: _createIcon, ...icons } = AllIcons
const iconMap = icons as Record<string, React.ComponentType<{ className?: string; surface?: Surface }>>
const iconNames = Object.keys(iconMap).sort()

const colorOptions = {
  "text-primary": "text-text-primary",
  "text-secondary": "text-text-secondary",
  "text-tertiary": "text-text-tertiary",
  "text-inactive": "text-text-inactive",
  "brand": "text-brand",
}

type PlaygroundArgs = {
  icon: string
  color: string
  size: string
  surface: Surface | "none"
}

const meta: Meta<PlaygroundArgs> = {
  title: "Foundation/Icons",
  parameters: {
    layout: "padded",
  },
  argTypes: {
    icon: {
      control: "select",
      options: iconNames,
      description: "Icon to display",
    },
    color: {
      control: "select",
      options: Object.keys(colorOptions),
      description: "Icon color token",
    },
    size: {
      control: "select",
      options: ["size-4", "size-5", "size-6", "size-8", "size-10"],
      description: "Icon size (Tailwind)",
    },
    surface: {
      control: "select",
      options: ["none", "light", "dark"],
      description:
        'Sets data-surface on the <svg>. "none" omits the attribute — colour comes from the ancestor cascade or the text-* class.',
    },
  },
  args: {
    icon: "IconHome",
    color: "text-primary",
    size: "size-6",
    surface: "none",
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: (args) => {
    const colorClass = colorOptions[args.color as keyof typeof colorOptions] ?? "text-text-primary"
    const sizeClass = args.size
    const Icon = iconMap[args.icon] ?? iconMap.IconHome!
    const surfaceProp = args.surface !== "none" ? args.surface : undefined

    return (
      <div className="flex flex-col gap-6">
        <p className="text-sm text-text-secondary">
          Icons inherit color from <code className="text-xs">currentColor</code>.
          Use the <strong>surface</strong> control or the <strong>Surface</strong> toolbar to see surface-aware tokens adapt.
        </p>
        <div className="flex items-center gap-6">
          <Icon className={`${sizeClass} ${colorClass}`} surface={surfaceProp} />
          <div className="flex flex-col gap-1">
            <code className="text-xs text-text-primary">{args.icon}</code>
            <code className="text-2xs text-text-tertiary">
              {colorClass} · {sizeClass}{surfaceProp ? ` · surface="${surfaceProp}"` : ""}
            </code>
          </div>
        </div>
      </div>
    )
  },
}

export const IconGrid: Story = {
  render: () => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4">
      {iconNames.map((name) => {
        const Icon = iconMap[name]!
        return (
          <div key={name} className="flex flex-col items-center gap-2 rounded-lg border border-divider p-3">
            <Icon className="size-6 text-text-primary" />
            <code className="text-center text-2xs text-text-tertiary leading-tight break-all">{name}</code>
          </div>
        )
      })}
    </div>
  ),
}

export const SurfaceComparison: Story = {
  render: () => {
    const IconHome = iconMap.IconHome!
    const IconCar = iconMap.IconCar!
    const IconHeart = iconMap.IconHeart!

    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div data-surface="light" className="rounded-lg bg-white p-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-wide text-text-tertiary">
            Light surface
          </p>
          <div className="flex flex-col gap-4">
            {Object.entries(colorOptions).map(([label, cls]) => (
              <div key={label} className="flex items-center gap-4">
                <div className="flex gap-2">
                  <IconHome className={`size-5 ${cls}`} />
                  <IconCar className={`size-5 ${cls}`} />
                  <IconHeart className={`size-5 ${cls}`} />
                </div>
                <code className="text-2xs text-text-tertiary">{label}</code>
              </div>
            ))}
          </div>
        </div>
        <div data-surface="dark" className="rounded-lg bg-neutral-900 p-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-wide text-text-tertiary">
            Dark surface
          </p>
          <div className="flex flex-col gap-4">
            {Object.entries(colorOptions).map(([label, cls]) => (
              <div key={label} className="flex items-center gap-4">
                <div className="flex gap-2">
                  <IconHome className={`size-5 ${cls}`} />
                  <IconCar className={`size-5 ${cls}`} />
                  <IconHeart className={`size-5 ${cls}`} />
                </div>
                <code className="text-2xs text-text-tertiary">{label}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  },
}

export const SurfaceAdaptation: Story = {
  render: () => {
    const IconHome = iconMap.IconHome!
    const IconHeart = iconMap.IconHeart!
    const IconSearch = iconMap.IconSearch!

    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">
            No surface prop — inherits from ancestor cascade
          </p>
          <div className="flex items-center gap-4">
            <IconHome className="size-5 text-text-primary" />
            <IconHeart className="size-5 text-text-primary" />
            <IconSearch className="size-5 text-text-primary" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">
            surface="light" — resolves to dark text tokens
          </p>
          <div className="flex items-center gap-4 rounded-lg bg-white p-4">
            <IconHome className="size-5 text-text-primary" surface="light" />
            <IconHeart className="size-5 text-text-primary" surface="light" />
            <IconSearch className="size-5 text-text-primary" surface="light" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-text-tertiary">
            surface="dark" — resolves to light text tokens
          </p>
          <div className="flex items-center gap-4 rounded-lg bg-neutral-900 p-4">
            <IconHome className="size-5 text-text-primary" surface="dark" />
            <IconHeart className="size-5 text-text-primary" surface="dark" />
            <IconSearch className="size-5 text-text-primary" surface="dark" />
          </div>
        </div>
      </div>
    )
  },
}
