import type { Meta, StoryObj } from "@storybook/react"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/field"
import { Input } from "@/components/input"

const meta = {
  title: "Form/Field/FieldDescription",
  component: FieldDescription,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Helper/hint text rendered beneath an input. Supports inline `<a>` " +
          "links with built-in underline + hover styles. When placed immediately " +
          "after a `FieldLegend`, a negative margin reset tightens the gap.\n\n" +
          "[shadcn docs](https://ui.shadcn.com/docs/components/base/field) · " +
          "[Base UI docs](https://base-ui.com/react/components/field)",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: "text",
      description: "Description content — plain text or inline HTML (links).",
    },
  },
  args: {
    children: "This is your public display name.",
  },
  render: (args) => (
    <Field>
      <FieldLabel htmlFor="desc-demo">Username</FieldLabel>
      <FieldContent>
        <Input id="desc-demo" placeholder="johndoe" />
        <FieldDescription>{args.children}</FieldDescription>
      </FieldContent>
    </Field>
  ),
} satisfies Meta<typeof FieldDescription>

export default meta
type Story = StoryObj<typeof meta>

/** Default — plain helper text. */
export const Default: Story = {}

/** With a single inline link. */
export const WithLink: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="desc-link">Email</FieldLabel>
      <FieldContent>
        <Input id="desc-link" type="email" placeholder="you@example.com" />
        <FieldDescription>
          We'll use this to send receipts. See our{" "}
          <a href="#privacy">privacy policy</a>.
        </FieldDescription>
      </FieldContent>
    </Field>
  ),
}

/** With multiple inline links. */
export const MultipleLinks: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="desc-multi">Password</FieldLabel>
      <FieldContent>
        <Input id="desc-multi" type="password" />
        <FieldDescription>
          Must meet our <a href="#requirements">password requirements</a>. Need
          help? <a href="#reset">Reset your password</a>.
        </FieldDescription>
      </FieldContent>
    </Field>
  ),
}

/** After a FieldLegend — tests the negative margin reset. */
export const AfterLegend: Story = {
  render: () => (
    <FieldSet>
      <FieldLegend variant="legend">Shipping Address</FieldLegend>
      <FieldDescription>
        Enter the address where you'd like your order delivered.
      </FieldDescription>
      <Field>
        <FieldLabel htmlFor="desc-leg">Street</FieldLabel>
        <Input id="desc-leg" placeholder="123 Main St" />
      </Field>
    </FieldSet>
  ),
}
