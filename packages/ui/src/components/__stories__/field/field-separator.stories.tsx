import type { Meta, StoryObj } from "@storybook/react"

import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/field"
import { Input } from "@/components/input"

const meta = {
  title: "Form/Field/FieldSeparator",
  component: FieldSeparator,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A visual divider between fields within a `FieldGroup`. Optionally " +
          "accepts `children` text that renders centered over the separator line.\n\n" +
          "[shadcn docs](https://ui.shadcn.com/docs/components/base/field) · " +
          "[Base UI docs](https://base-ui.com/react/components/field)",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: "text",
      description:
        "Optional text displayed centered over the separator line (e.g. \"or\").",
    },
  },
  args: {
    children: undefined,
  },
  decorators: [
    (Story) => (
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="sep-above">Above</FieldLabel>
          <Input id="sep-above" placeholder="Above separator" />
        </Field>
        <Story />
        <Field>
          <FieldLabel htmlFor="sep-below">Below</FieldLabel>
          <Input id="sep-below" placeholder="Below separator" />
        </Field>
      </FieldGroup>
    ),
  ],
} satisfies Meta<typeof FieldSeparator>

export default meta
type Story = StoryObj<typeof meta>

/** Default — plain horizontal line with no text. */
export const Default: Story = {}

/** With short text content. */
export const WithText: Story = {
  args: { children: "or" },
}

/** With longer text content. */
export const LongText: Story = {
  args: { children: "or use a different method" },
}
