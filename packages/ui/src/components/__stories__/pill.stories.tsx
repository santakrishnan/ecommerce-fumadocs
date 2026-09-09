import type { Meta, StoryObj } from "@storybook/react"
import { expect, fn, userEvent, within } from "storybook/test"

import { Pill, PillGroup } from "@/components/pill"
import type { PillProps } from "@/components/pill"
import { IconClose, IconFilter } from "@/icons"

const meta = {
  title: "Components/Pill",
  component: PillGroup,
  parameters: {
    layout: "padded",
    backgrounds: { default: "light" },
    docs: {
      description: {
        component:
          "Surface-aware pill selection controls built on [Base UI Toggle](https://base-ui.com/react/components/toggle) and [Base UI ToggleGroup](https://base-ui.com/react/components/toggle-group). Supports single-select and multi-select modes, adornments, density control, and automatic surface inheritance via `data-surface`.\n\n**Selection flow:** click to select → close button (×) appears → click × to deselect. Clicking the pill body while selected does nothing unless `hideClose` is set.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    density: {
      control: "select",
      options: ["compact", "standard"],
    },
    surface: {
      control: "select",
      options: ["light", "dark"],
    },
  },
  args: {
    density: "standard",
  },
} satisfies Meta<typeof PillGroup>

export default meta
type Story = StoryObj<typeof meta>

// --- Standalone Pill story (Controls-driven) ---

export const PillPlayground: StoryObj<PillProps> = {
  render: (args) => (
    <Pill {...args}>
      {args.children}
    </Pill>
  ),
  args: {
    children: "Label",
    disabled: false,
    surface: undefined,
    hideClose: false,
    onPressedChange: fn(),
  },
  argTypes: {
    children: { control: "text", name: "label" },
    disabled: { control: "boolean" },
    hideClose: { control: "boolean" },
    surface: { control: "select", options: [undefined, "light", "dark"] },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Single `Pill` playground. Edit the label, toggle `disabled`, `hideClose`, and switch `surface` via the Controls panel. Default flow: click to select → × appears → click × to deselect. Set `hideClose` to restore classic toggle behavior.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const pill = canvas.getByRole("button", { name: /label/i })

    await expect(pill).toHaveAttribute("aria-pressed", "false")

    await userEvent.click(pill)
    await expect(pill).toHaveAttribute("aria-pressed", "true")

    const closeBtn = canvas.getByRole("button", { name: /remove/i })
    await userEvent.click(closeBtn)
    await expect(pill).toHaveAttribute("aria-pressed", "false")
  },
}

// --- Selection mode stories ---

export const SingleSelect: Story = {
  args: {
    density: "standard",
  },
  render: (args) => (
    <PillGroup {...args}>
      <Pill value="suv">SUV</Pill>
      <Pill value="sedan">Sedan</Pill>
      <Pill value="truck">Truck</Pill>
      <Pill value="hybrid">Hybrid</Pill>
      <Pill value="ev">Electric</Pill>
    </PillGroup>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Single-select mode (default). Click to select — × appears. Click × to deselect, or select another pill to switch selection. Clicking the selected pill body does nothing.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const suv = canvas.getByRole("button", { name: "SUV" })
    const sedan = canvas.getByRole("button", { name: "Sedan" })

    await userEvent.click(suv)
    await expect(suv).toHaveAttribute("aria-pressed", "true")

    await userEvent.click(sedan)
    await expect(sedan).toHaveAttribute("aria-pressed", "true")
    await expect(suv).toHaveAttribute("aria-pressed", "false")

    const pressedButtons = canvas
      .getAllByRole("button")
      .filter((btn) => btn.getAttribute("aria-pressed") === "true")
    await expect(pressedButtons).toHaveLength(1)
  },
}

export const MultiSelect: Story = {
  args: {
    density: "standard",
    multiple: true,
  },
  render: (args) => (
    <PillGroup {...args}>
      <Pill value="suv">SUV</Pill>
      <Pill value="sedan">Sedan</Pill>
      <Pill value="truck">Truck</Pill>
      <Pill value="hybrid">Hybrid</Pill>
      <Pill value="ev">Electric</Pill>
    </PillGroup>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Multi-select mode via `multiple` prop. Click to select multiple pills. Each selected pill shows × — click it to deselect that pill individually.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const suv = canvas.getByRole("button", { name: "SUV" })
    const sedan = canvas.getByRole("button", { name: "Sedan" })
    const hybrid = canvas.getByRole("button", { name: "Hybrid" })

    await userEvent.click(suv)
    await userEvent.click(sedan)
    await userEvent.click(hybrid)

    await expect(suv).toHaveAttribute("aria-pressed", "true")
    await expect(sedan).toHaveAttribute("aria-pressed", "true")
    await expect(hybrid).toHaveAttribute("aria-pressed", "true")
  },
}

// --- Surface stories ---

export const SurfaceLight: Story = {
  render: () => (
    <div className="rounded-xl bg-white p-4">
      <p className="mb-2 text-xs text-text-muted">Light surface</p>
      <PillGroup surface="light" density="standard">
        <Pill value="suv">SUV</Pill>
        <Pill value="sedan">Sedan</Pill>
        <Pill value="truck">Truck</Pill>
      </PillGroup>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Light surface — pills render with `border-neutral-200` unselected and `border-neutral-500` selected.",
      },
    },
  },
}

export const SurfaceDark: Story = {
  render: () => (
    <div className="rounded-xl bg-surface-dark p-4">
      <p className="mb-2 text-xs text-text-inverse">Dark surface</p>
      <PillGroup surface="dark" density="standard">
        <Pill value="suv">SUV</Pill>
        <Pill value="sedan">Sedan</Pill>
        <Pill value="truck">Truck</Pill>
      </PillGroup>
    </div>
  ),
  parameters: {
    backgrounds: { default: "dark" },
    docs: {
      description: {
        story:
          "Dark surface — pills render with no border in either state. Pass `surface=\"dark\"` to `PillGroup`.",
      },
    },
  },
}

export const SurfaceComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-0 overflow-hidden rounded-xl">
      <div className="bg-surface-dark p-4">
        <p className="mb-2 text-xs text-text-inverse">Dark surface</p>
        <PillGroup surface="dark" density="standard">
          <Pill value="suv">SUV</Pill>
          <Pill value="sedan">Sedan</Pill>
          <Pill value="truck">Truck</Pill>
        </PillGroup>
      </div>
      <div className="bg-white p-4">
        <p className="mb-2 text-xs text-text-muted">Light surface</p>
        <PillGroup surface="light" density="standard">
          <Pill value="suv">SUV</Pill>
          <Pill value="sedan">Sedan</Pill>
          <Pill value="truck">Truck</Pill>
        </PillGroup>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Side-by-side comparison of dark and light surface styles.",
      },
    },
  },
}

// --- Adornment story ---

export const WithAdornments: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-text-muted">
        Adornments use <code>data-icon="inline-start"</code> /{" "}
        <code>data-icon="inline-end"</code> on any child element. Padding
        auto-adjusts from 24px → 20px on the adornment side.
      </p>
      <PillGroup density="standard">
        <Pill value="filter">
          <IconFilter data-icon="inline-start" />
          Filter
        </Pill>
        <Pill value="dismiss">
          Dismiss
          <IconClose data-icon="inline-end" />
        </Pill>
        <Pill value="status">
          <div
            data-icon="inline-start"
            className="size-4 rounded-full bg-green-400"
          />
          Available
        </Pill>
        <Pill value="both">
          <IconFilter data-icon="inline-start" />
          Both
          <IconClose data-icon="inline-end" />
        </Pill>
        <Pill value="none">No adornment</Pill>
      </PillGroup>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Stamp `data-icon=\"inline-start\"` or `data-icon=\"inline-end\"` on any child — SVG icon, `div`, or anything else. The pill's `has-data-[icon]` CSS selectors reduce padding from 24px to 20px on the adornment side automatically. No props needed.",
      },
    },
  },
}

// --- Density story ---

export const DensityComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-xs text-text-muted">compact — gap-1 (4px)</p>
        <PillGroup density="compact">
          <Pill value="suv">SUV</Pill>
          <Pill value="sedan">Sedan</Pill>
          <Pill value="truck">Truck</Pill>
          <Pill value="hybrid">Hybrid</Pill>
          <Pill value="ev">Electric</Pill>
        </PillGroup>
      </div>
      <div>
        <p className="mb-2 text-xs text-text-muted">standard (default) — gap-2 (8px)</p>
        <PillGroup density="standard">
          <Pill value="suv">SUV</Pill>
          <Pill value="sedan">Sedan</Pill>
          <Pill value="truck">Truck</Pill>
          <Pill value="hybrid">Hybrid</Pill>
          <Pill value="ev">Electric</Pill>
        </PillGroup>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "`compact` = 4px gap, `standard` = 8px gap (default). Use compact for inline filter bars, standard for standalone option lists.",
      },
    },
  },
}

// --- Disabled story ---

export const DisabledState: Story = {
  render: () => (
    <PillGroup density="standard">
      <Pill value="active">Active</Pill>
      <Pill value="disabled" disabled>
        Disabled
      </Pill>
      <Pill value="another">Another</Pill>
    </PillGroup>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Disabled pills cannot be interacted with and render at reduced opacity. Keyboard navigation skips them.",
      },
    },
  },
}

// --- Close behavior stories ---

export const SelectedWithClose: StoryObj<PillProps> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-text-muted">
        Click a pill to select it — × appears. Click × to deselect.
        Clicking the pill body while selected does nothing.
      </p>
      <PillGroup density="standard">
        <Pill value="suv">SUV</Pill>
        <Pill value="sedan">Sedan</Pill>
        <Pill value="truck">Truck</Pill>
      </PillGroup>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Default close behavior. Once selected, the pill body is inert — only the × deselects. This prevents accidental deselection and makes the interaction explicit.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const suv = canvas.getByRole("button", { name: /suv/i })

    await userEvent.click(suv)
    await expect(suv).toHaveAttribute("aria-pressed", "true")

    const closeBtn = canvas.getByRole("button", { name: /remove/i })
    await expect(closeBtn).toBeInTheDocument()

    await userEvent.click(suv)
    await expect(suv).toHaveAttribute("aria-pressed", "true")

    await userEvent.click(closeBtn)
    await expect(suv).toHaveAttribute("aria-pressed", "false")
    await expect(canvas.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument()
  },
}

export const HideClose: StoryObj<PillProps> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-text-muted">
        <code>hideClose</code> — no × button. Clicking the pill toggles in both
        directions like a standard toggle.
      </p>
      <PillGroup density="standard">
        <Pill value="suv" hideClose>SUV</Pill>
        <Pill value="sedan" hideClose>Sedan</Pill>
        <Pill value="truck" hideClose>Truck</Pill>
      </PillGroup>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Pass `hideClose` to opt out of the close button entirely. The pill falls back to standard toggle behavior — clicking a selected pill deselects it directly. No breaking change for existing implementations that relied on this behavior.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const suv = canvas.getByRole("button", { name: "SUV" })

    await userEvent.click(suv)
    await expect(suv).toHaveAttribute("aria-pressed", "true")
    await expect(canvas.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument()

    await userEvent.click(suv)
    await expect(suv).toHaveAttribute("aria-pressed", "false")
  },
}

export const DisabledSelected: StoryObj<PillProps> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-text-muted">
        Disabled selected pill — no × button, no interaction.
      </p>
      <PillGroup density="standard">
        <Pill value="active">Active</Pill>
        <Pill value="disabled" defaultPressed disabled>
          Disabled Selected
        </Pill>
        <Pill value="another">Another</Pill>
      </PillGroup>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "A disabled pill that starts selected (`defaultPressed`) never renders the × button. `disabled` takes full precedence — no interaction possible.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const disabledPill = canvas.getByRole("button", { name: /disabled selected/i })

    await expect(disabledPill).toBeDisabled()
    await expect(disabledPill).toHaveAttribute("aria-pressed", "true")
    await expect(canvas.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument()
  },
}

export const GroupedWithClose: Story = {
  args: {
    density: "standard",
    onValueChange: fn(),
  },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-text-muted">
        Click to select. Click × to deselect, or click another pill to switch.
        Open the Actions panel to see <code>onValueChange</code> fire.
      </p>
      <PillGroup {...args}>
        <Pill value="suv">SUV</Pill>
        <Pill value="sedan">Sedan</Pill>
        <Pill value="truck">Truck</Pill>
        <Pill value="hybrid">Hybrid</Pill>
        <Pill value="ev">Electric</Pill>
      </PillGroup>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Single-select group with close buttons. Deselect via ×, or switch selection by clicking another pill. `onValueChange` fires with the updated array in both cases.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const suv = canvas.getByRole("button", { name: "SUV" })

    await userEvent.click(suv)
    await expect(suv).toHaveAttribute("aria-pressed", "true")

    await userEvent.click(suv)
    await expect(suv).toHaveAttribute("aria-pressed", "true")

    const closeBtn = canvas.getByRole("button", { name: /remove/i })
    await userEvent.click(closeBtn)
    await expect(suv).toHaveAttribute("aria-pressed", "false")
  },
}

export const MultiSelectWithClose: Story = {
  args: {
    density: "standard",
    multiple: true,
    onValueChange: fn(),
  },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-text-muted">
        Multi-select — each selected pill has its own ×.
      </p>
      <PillGroup {...args}>
        <Pill value="suv">SUV</Pill>
        <Pill value="sedan">Sedan</Pill>
        <Pill value="truck">Truck</Pill>
        <Pill value="hybrid">Hybrid</Pill>
        <Pill value="ev">Electric</Pill>
      </PillGroup>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Multi-select mode. Each pill shows × when selected. Closing one removes only that value — others stay selected.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const suv = canvas.getByRole("button", { name: "SUV" })
    const sedan = canvas.getByRole("button", { name: "Sedan" })

    await userEvent.click(suv)
    await userEvent.click(sedan)
    await expect(suv).toHaveAttribute("aria-pressed", "true")
    await expect(sedan).toHaveAttribute("aria-pressed", "true")

    const closeBtns = canvas.getAllByRole("button", { name: /remove/i })
    await expect(closeBtns).toHaveLength(2)

    const firstClose = closeBtns[0]
    if (firstClose) {
      await userEvent.click(firstClose)
    }
    await expect(suv).toHaveAttribute("aria-pressed", "false")
    await expect(sedan).toHaveAttribute("aria-pressed", "true")
  },
}

export const KeyboardClose: StoryObj<PillProps> = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <p className="text-xs text-text-muted">
        Tab to the × button, then press Space or Enter to deselect.
      </p>
      <Pill defaultPressed>
        Keyboard test
      </Pill>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The × button is focusable via Tab when visible. Press Space or Enter to deselect.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const pill = canvas.getByRole("button", { name: /keyboard test/i })

    await expect(pill).toHaveAttribute("aria-pressed", "true")
    const closeBtn = canvas.getByRole("button", { name: /remove/i })

    closeBtn.focus()
    await expect(closeBtn).toHaveFocus()
    await userEvent.keyboard(" ")
    await expect(pill).toHaveAttribute("aria-pressed", "false")
  },
}


// --- Hover & Keyboard interaction story ---

export const HoverAndKeyboard: Story = {
  args: {
    density: "standard",
    surface: undefined,
  },
  render: (args) => (
    <PillGroup {...args}>
      <Pill value="suv" defaultPressed>SUV</Pill>
      <Pill value="camry">Camry</Pill>
      <Pill value="camry-add" hideClose>
        Camry
        <IconClose data-icon="inline-end" className="rotate-45" />
      </Pill>
      <Pill value="black-selected" defaultPressed>
        <div data-icon="inline-start" className="size-4 rounded-full bg-black" />
        Black
      </Pill>
      <Pill value="black-unselected" hideClose>
        <div data-icon="inline-start" className="size-4 rounded-full bg-black" />
        Black
      </Pill>
      <Pill value="black-add" hideClose>
        <div data-icon="inline-start" className="size-4 rounded-full bg-black" />
        Black
        <IconClose data-icon="inline-end" className="rotate-45" />
      </Pill>
    </PillGroup>
  ),
  argTypes: {
    surface: { control: "select", options: [undefined, "light", "dark"] },
    density: { control: "select", options: ["compact", "standard"] },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Hover and keyboard interaction. Hover over pills to see hover style. Tab into the group, use Left/Right arrows to move focus, Enter/Space to select. Switch surface via Controls to see dark-surface hover. Shows selected (×), unselected, unselected with add (+), and color swatch variants.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const suv = canvas.getByRole("button", { name: /SUV/i })
    const camryButtons = canvas.getAllByRole("button", { name: /Camry/i })

    await expect(camryButtons).not.toHaveLength(0)

    const camry = camryButtons[0]
    suv.focus()
    await expect(suv).toHaveFocus()

    await userEvent.keyboard("{ArrowRight}")
    await expect(camry).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    await expect(camry).toHaveAttribute("aria-pressed", "true")
  },
}
