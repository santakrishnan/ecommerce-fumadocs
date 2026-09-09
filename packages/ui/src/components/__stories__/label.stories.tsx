import type { Meta, StoryObj } from "@storybook/react"

import { Field, FieldLabel } from "@/components/field"
import { Input } from "@/components/input"
import { Label } from "@/components/label"

/**
 * Label — a styled `<label>` element for associating text with form controls.
 *
 * Supports disabled state propagation via group-data attributes and
 * peer-disabled selectors.
 */
const meta = {
  title: "Form/Label",
  component: Label,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A label element for form controls. Propagates disabled styling " +
          "from parent group and peer elements.\n\n" +
          "[shadcn docs](https://ui.shadcn.com/docs/components/base/label)",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

/** Standalone label. */
export const Default: Story = {
  render: () => <Label>Email address</Label>,
}

/** Label associated with an input via htmlFor. */
export const WithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="label-input">Username</Label>
      <Input id="label-input" placeholder="johndoe" />
    </div>
  ),
}

/** FieldLabel inside a Field — the recommended composition pattern. */
export const AsFieldLabel: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="field-label-input">Full name</FieldLabel>
      <Input id="field-label-input" placeholder="Jane Doe" />
    </Field>
  ),
}

/** Disabled label — reduced opacity via group-data-disabled. */
export const Disabled: Story = {
  render: () => (
    <Field data-disabled="true">
      <FieldLabel htmlFor="disabled-label-input">Email</FieldLabel>
      <Input id="disabled-label-input" disabled placeholder="you@example.com" />
    </Field>
  ),
}
