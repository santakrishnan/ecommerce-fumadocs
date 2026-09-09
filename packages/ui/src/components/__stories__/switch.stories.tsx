import type { Meta, StoryObj } from "@storybook/react"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/field"
import { Switch } from "@/components/switch"

/**
 * Switch — a toggle switch built on Base UI's Switch primitive.
 *
 * Supports two sizes (default, sm) and composes inside Field
 * for labeling and description.
 */
const meta = {
  title: "Form - WIP/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A toggle switch built on [Base UI Switch](https://base-ui.com/react/components/switch). " +
          "Original shadcn implementation: [shadcn/ui Switch (Base)](https://ui.shadcn.com/docs/components/base/switch).",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["default", "sm"],
    },
    disabled: { control: "boolean" },
    defaultChecked: { control: "boolean" },
  },
  args: {
    size: "default",
    disabled: false,
    defaultChecked: false,
  },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

/** Default unchecked switch. */
export const Default: Story = {}

/** Switch in checked state. */
export const Checked: Story = {
  args: { defaultChecked: true },
}

/** Small size switch. */
export const Small: Story = {
  args: { size: "sm" },
}

/** Small size switch, checked. */
export const SmallChecked: Story = {
  args: { size: "sm", defaultChecked: true },
}

/** Disabled switch — non-interactive with reduced opacity. */
export const Disabled: Story = {
  args: { disabled: true },
}

/** Disabled and checked. */
export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
}

/** Switch with label composed in a horizontal Field. */
export const WithLabel: Story = {
  render: () => (
    <Field orientation="horizontal">
      <Switch id="sw-label" />
      <FieldLabel htmlFor="sw-label">Airplane mode</FieldLabel>
    </Field>
  ),
}

/** Switch with label and description. */
export const WithDescription: Story = {
  render: () => (
    <Field orientation="horizontal">
      <Switch id="sw-desc" />
      <FieldContent>
        <FieldLabel htmlFor="sw-desc">Dark mode</FieldLabel>
        <FieldDescription>
          Toggle between light and dark themes.
        </FieldDescription>
      </FieldContent>
    </Field>
  ),
}

/** Multiple switches in a group. */
export const Group: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Field orientation="horizontal">
        <Switch id="sw-g1" defaultChecked />
        <FieldLabel htmlFor="sw-g1">Email notifications</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Switch id="sw-g2" />
        <FieldLabel htmlFor="sw-g2">Push notifications</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Switch id="sw-g3" />
        <FieldLabel htmlFor="sw-g3">SMS notifications</FieldLabel>
      </Field>
    </div>
  ),
}
