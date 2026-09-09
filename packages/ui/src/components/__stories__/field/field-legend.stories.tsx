import type { Meta, StoryObj } from "@storybook/react"

import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/field"
import { Switch } from "@/components/switch"

const meta = {
  title: "Form/Field/FieldLegend",
  component: FieldLegend,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A `<legend>` element that must live inside a `<FieldSet>` (which renders a " +
          "semantic `<fieldset>`). It names a *group* of related controls — screen readers " +
          "announce it as context for every control inside that fieldset. Use it when you " +
          "have multiple fields that belong together semantically (e.g. \"Shipping Address\", " +
          "\"Payment Method\"). Supports a `variant` prop to switch between full-size heading " +
          "(`legend`) and smaller label-like (`label`) styling.\n\n" +
          "[shadcn docs](https://ui.shadcn.com/docs/components/base/field) · " +
          "[Base UI docs](https://base-ui.com/react/components/field)",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["legend", "label"],
      description:
        "Visual variant — `legend` renders larger heading text, `label` renders smaller label-like text.",
    },
    children: {
      control: "text",
      description: "Legend content.",
    },
  },
  args: {
    variant: "legend",
    children: "Section Heading",
  },
  render: (args) => (
    <FieldSet>
      <FieldLegend variant={args.variant}>{args.children}</FieldLegend>
      <FieldGroup>
        <Field orientation="horizontal">
          <Switch id="legend-demo-1" />
          <FieldLabel htmlFor="legend-demo-1">Option A</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Switch id="legend-demo-2" />
          <FieldLabel htmlFor="legend-demo-2">Option B</FieldLabel>
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
} satisfies Meta<typeof FieldLegend>

export default meta
type Story = StoryObj<typeof meta>

/** Default "legend" variant — full-size section heading. */
export const Legend: Story = {
  args: { variant: "legend", children: "Account Settings" },
}

/** "label" variant — smaller, label-like styling. */
export const Label: Story = {
  args: { variant: "label", children: "Preferences" },
}
