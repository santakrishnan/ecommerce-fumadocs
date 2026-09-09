import type { Meta, StoryObj } from "@storybook/react"
import { expect, fn, userEvent, within } from "storybook/test"

import { Button } from "@/components/button"
import * as BrandIcons from "@/icons"

const { createIcon: _createIcon, ...icons } = BrandIcons
const iconMap: Record<string, unknown> = { None: undefined, ...icons }
const iconOptions = Object.keys(iconMap)

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A polymorphic button built on [Base UI Button](https://base-ui.com/react/components/button#api-reference). " +
          "Original shadcn implementation: [shadcn/ui Button (Base)](https://ui.shadcn.com/docs/components/base/button).",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "text"],
    },
    size: {
      control: "select",
      options: ["sm", "lg", "icon", "icon-sm", "icon-lg"],
    },
    surface: {
      control: "select",
      options: ["light", "dark"],
    },
    disabled: {
      control: "boolean"
    },
    leadingIcon: {
      control: "select",
      options: iconOptions,
      mapping: iconMap,
    },
    trailingIcon: {
      control: "select",
      options: iconOptions,
      mapping: iconMap,
    },
  },
  args: {
    children: "Button",
    variant: "primary",
    size: "sm",
    disabled: false,
    fullWidth: false,
    nativeButton: true,
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    onClick: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole("button", { name: "Button" })

    await expect(button).toBeInTheDocument()
    await userEvent.click(button)
    await expect(args.onClick).toHaveBeenCalledOnce()
  },
}

// --- Matrix story ---
export const Matrix: Story = {
  render: () => (
    <div className="space-y-12">
      {/* Text Sizes */}
      <section>
        <h3 className="text-sm font-semibold text-text-primary mb-4">Text Sizes</h3>
        <div className="grid grid-cols-[auto_repeat(4,1fr)] gap-3 items-center justify-items-center">
          <div />
          <strong className="text-xs text-text-primary">Primary</strong>
          <strong className="text-xs text-text-primary">Secondary</strong>
          <strong className="text-xs text-text-primary">Tertiary</strong>
          <strong className="text-xs text-text-primary">Text</strong>

          <span className="text-xs text-text-secondary">SM</span>
          <Button variant="primary" size="sm">Button</Button>
          <Button variant="secondary" size="sm">Button</Button>
          <Button variant="tertiary" size="sm">Button</Button>
          <Button variant="text" size="sm">Button</Button>

          <span className="text-xs text-text-secondary">LG</span>
          <Button variant="primary" size="lg">Button</Button>
          <Button variant="secondary" size="lg">Button</Button>
          <Button variant="tertiary" size="lg">Button</Button>
          <Button variant="text" size="lg">Button</Button>
        </div>
      </section>

      {/* Icon Sizes */}
      <section>
        <h3 className="text-sm font-semibold text-text-primary mb-4">Icon Sizes</h3>
        <div className="grid grid-cols-[auto_repeat(4,1fr)] gap-3 items-center justify-items-center">
          <div />
          <strong className="text-xs text-text-primary">Primary</strong>
          <strong className="text-xs text-text-primary">Secondary</strong>
          <strong className="text-xs text-text-primary">Tertiary</strong>
          <strong className="text-xs text-text-primary">Text</strong>

          <span className="text-xs text-text-secondary">icon-sm</span>
          <Button variant="primary" size="icon-sm" leadingIcon={BrandIcons.IconClose} aria-label="Close" />
          <Button variant="secondary" size="icon-sm" leadingIcon={BrandIcons.IconClose} aria-label="Close" />
          <Button variant="tertiary" size="icon-sm" leadingIcon={BrandIcons.IconClose} aria-label="Close" />
          <Button variant="text" size="icon-sm" leadingIcon={BrandIcons.IconClose} aria-label="Close" />

          <span className="text-xs text-text-secondary">icon</span>
          <Button variant="primary" size="icon" leadingIcon={BrandIcons.IconClose} aria-label="Close" />
          <Button variant="secondary" size="icon" leadingIcon={BrandIcons.IconClose} aria-label="Close" />
          <Button variant="tertiary" size="icon" leadingIcon={BrandIcons.IconClose} aria-label="Close" />
          <Button variant="text" size="icon" leadingIcon={BrandIcons.IconClose} aria-label="Close" />

          <span className="text-xs text-text-secondary">icon-lg</span>
          <Button variant="primary" size="icon-lg" leadingIcon={BrandIcons.IconClose} aria-label="Close" />
          <Button variant="secondary" size="icon-lg" leadingIcon={BrandIcons.IconClose} aria-label="Close" />
          <Button variant="tertiary" size="icon-lg" leadingIcon={BrandIcons.IconClose} aria-label="Close" />
          <Button variant="text" size="icon-lg" leadingIcon={BrandIcons.IconClose} aria-label="Close" />
        </div>
      </section>

      {/* Dark Surface — Text Sizes */}
      <section>
        <h3 className="text-sm font-semibold text-text-primary mb-4">Surface-Aware — Text (Dark)</h3>
        <div data-surface="dark" className="grid grid-cols-[auto_repeat(4,1fr)] gap-3 items-center justify-items-center p-8 rounded-xl bg-neutral-900">
          <div />
          <strong className="text-xs text-text-primary">Primary</strong>
          <strong className="text-xs text-text-primary">Secondary</strong>
          <strong className="text-xs text-text-primary">Tertiary</strong>
          <strong className="text-xs text-text-primary">Text</strong>

          <span className="text-xs text-text-secondary">SM</span>
          <Button variant="primary" size="sm">Button</Button>
          <Button variant="secondary" size="sm">Button</Button>
          <Button variant="tertiary" size="sm">Button</Button>
          <Button variant="text" size="sm">Button</Button>

          <span className="text-xs text-text-secondary">LG</span>
          <Button variant="primary" size="lg">Button</Button>
          <Button variant="secondary" size="lg">Button</Button>
          <Button variant="tertiary" size="lg">Button</Button>
          <Button variant="text" size="lg">Button</Button>
        </div>
      </section>

      {/* Dark Surface — Icon Sizes */}
      <section>
        <h3 className="text-sm font-semibold text-text-primary mb-4">Surface-Aware — Icons (Dark)</h3>
        <div data-surface="dark" className="grid grid-cols-[auto_repeat(4,1fr)] gap-3 items-center justify-items-center p-8 rounded-xl bg-neutral-900">
          <div />
          <strong className="text-xs text-text-primary">Primary</strong>
          <strong className="text-xs text-text-primary">Secondary</strong>
          <strong className="text-xs text-text-primary">Tertiary</strong>
          <strong className="text-xs text-text-primary">Text</strong>

          <span className="text-xs text-text-secondary">icon-sm</span>
          <Button variant="primary" size="icon-sm" leadingIcon={BrandIcons.IconClose} aria-label="Close" />
          <Button variant="secondary" size="icon-sm" leadingIcon={BrandIcons.IconClose} aria-label="Close" />
          <Button variant="tertiary" size="icon-sm" leadingIcon={BrandIcons.IconClose} aria-label="Close" />
          <Button variant="text" size="icon-sm" leadingIcon={BrandIcons.IconClose} aria-label="Close" />

          <span className="text-xs text-text-secondary">icon</span>
          <Button variant="primary" size="icon" leadingIcon={BrandIcons.IconClose} aria-label="Close" />
          <Button variant="secondary" size="icon" leadingIcon={BrandIcons.IconClose} aria-label="Close" />
          <Button variant="tertiary" size="icon" leadingIcon={BrandIcons.IconClose} aria-label="Close" />
          <Button variant="text" size="icon" leadingIcon={BrandIcons.IconClose} aria-label="Close" />

          <span className="text-xs text-text-secondary">icon-lg</span>
          <Button variant="primary" size="icon-lg" leadingIcon={BrandIcons.IconClose} aria-label="Close" />
          <Button variant="secondary" size="icon-lg" leadingIcon={BrandIcons.IconClose} aria-label="Close" />
          <Button variant="tertiary" size="icon-lg" leadingIcon={BrandIcons.IconClose} aria-label="Close" />
          <Button variant="text" size="icon-lg" leadingIcon={BrandIcons.IconClose} aria-label="Close" />
        </div>
      </section>
    </div>
  ),
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: "Side-by-side overview of all variant × size combinations on light and dark surfaces.",
      },
    },
  },
}

// --- Variant stories ---
export const Secondary: Story = {
  args: { variant: "secondary" },
}

export const Tertiary: Story = {
  args: { variant: "tertiary" },
}

export const Text: Story = {
  args: { variant: "text" },
}

// --- Size stories ---
export const SizeSm: Story = {
  args: { size: "sm" },
}

export const SizeLg: Story = {
  args: { size: "lg" },
}

export const SizeIcon: Story = {
  args: { size: "icon", children: undefined, leadingIcon: BrandIcons.IconClose, "aria-label": "Close" },
}

export const SizeIconSm: Story = {
  args: { size: "icon-sm", children: undefined, leadingIcon: BrandIcons.IconClose, "aria-label": "Close" },
}

export const SizeIconLg: Story = {
  args: { size: "icon-lg", children: undefined, leadingIcon: BrandIcons.IconClose, "aria-label": "Close" },
}

// --- Icon stories ---
export const WithLeadingIcon: Story = {
  args: { leadingIcon: BrandIcons.IconClose },
}

export const WithTrailingIcon: Story = {
  args: { trailingIcon: BrandIcons.IconArrowRight },
}

export const WithBothIcons: Story = {
  args: { leadingIcon: BrandIcons.IconSaved, trailingIcon: BrandIcons.IconArrowRight },
}

// --- Prop stories ---
export const FullWidth: Story = {
  args: { fullWidth: true },
  parameters: { layout: "padded" },
}

export const Disabled: Story = {
  args: { disabled: true },
}

// --- Surface-aware stories ---
export const SurfaceContextDark: Story = {
  render: (args) => (
    <div data-surface="dark" className="bg-neutral-900 p-8">
      <Button {...args} />
    </div>
  ),
  args: {
    children: "Button",
    variant: "primary",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates automatic surface adaptation. The Button inherits dark-surface styling from the ancestor `data-surface=\"dark\"` attribute without an explicit `surface` prop.",
      },
    },
  },
}

export const SurfacePropDark: Story = {
  args: {
    children: "Button",
    variant: "primary",
    surface: "dark",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates explicit prop-based surface styling. The Button applies dark-surface colors via `surface=\"dark\"` without needing a dark ancestor wrapper.",
      },
    },
  },
}

export const SurfacePropOverride: Story = {
  render: (args) => (
    <div data-surface="dark" className="bg-neutral-900 p-8">
      <Button {...args} />
    </div>
  ),
  args: {
    children: "Button",
    variant: "primary",
    surface: "light",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates prop override behavior. Despite being inside a `data-surface=\"dark\"` ancestor, the Button renders with light-surface styling because `surface=\"light\"` takes precedence.",
      },
    },
  },
}
