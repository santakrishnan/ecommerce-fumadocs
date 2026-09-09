import type { Meta, StoryObj } from "@storybook/react"

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/field"
import { Input } from "@/components/input"

const meta = {
  title: "Form/Field/FieldSet",
  component: FieldSet,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A semantic `<fieldset>` wrapper. Pair with `FieldLegend` for accessible " +
          "group headings. Provides gap spacing for direct children.\n\n" +
          "[shadcn docs](https://ui.shadcn.com/docs/components/base/field) · " +
          "[Base UI docs](https://base-ui.com/react/components/field)",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      table: { disable: true },
    },
  },
} satisfies Meta<typeof FieldSet>

export default meta
type Story = StoryObj<typeof meta>

/** Default — FieldSet with legend and two fields. */
export const Default: Story = {
  render: () => (
    <FieldSet>
      <FieldLegend>Contact Information</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="set-name">Name</FieldLabel>
          <Input id="set-name" placeholder="Jane Doe" />
        </Field>
        <Field>
          <FieldLabel htmlFor="set-email">Email</FieldLabel>
          <Input id="set-email" type="email" placeholder="you@example.com" />
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
}

/** With description after legend. */
export const WithDescription: Story = {
  render: () => (
    <FieldSet>
      <FieldLegend>Shipping Address</FieldLegend>
      <FieldDescription>
        Enter the address where you'd like your order delivered.
      </FieldDescription>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="set-street">Street</FieldLabel>
          <Input id="set-street" placeholder="123 Main St" />
        </Field>
        <Field>
          <FieldLabel htmlFor="set-city">City</FieldLabel>
          <Input id="set-city" placeholder="Springfield" />
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
}
