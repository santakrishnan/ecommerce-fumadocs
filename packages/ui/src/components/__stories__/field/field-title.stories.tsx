import type { Meta, StoryObj } from "@storybook/react"

import { Checkbox } from "@/components/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/field"
import { Input } from "@/components/input"

const meta = {
  title: "Form/Field/FieldTitle",
  component: FieldTitle,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A plain `<div>` with no semantic role — purely visual. It does not associate " +
          "with any input and screen readers do not announce it as a label. Use it for " +
          "decorative section headings within a form where controls beneath already have " +
          "their own labels and you just need a visual divider, not a semantic grouping. " +
          "If the heading introduces a group of related controls, prefer `FieldSet` + " +
          "`FieldLegend` instead for accessibility.\n\n" +
          "[shadcn docs](https://ui.shadcn.com/docs/components/base/field) · " +
          "[Base UI docs](https://base-ui.com/react/components/field)",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: "text",
      description: "Title content.",
    },
  },
  args: {
    children: "Section Title",
  },
  render: (args) => (
    <Field>
      <FieldTitle>{args.children}</FieldTitle>
      <FieldContent>
        <Input placeholder="Value" />
      </FieldContent>
    </Field>
  ),
} satisfies Meta<typeof FieldTitle>

export default meta
type Story = StoryObj<typeof meta>

/** Default — simple heading text. */
export const Default: Story = {}

/** With FieldDescription — heading + hint combo above a group. */
export const WithDescription: Story = {
  render: () => (
    <FieldGroup>
      <Field>
        <FieldContent>
          <FieldTitle>Notification Preferences</FieldTitle>
          <FieldDescription>
            Choose how you'd like to be notified about account activity.
          </FieldDescription>
        </FieldContent>
      </Field>
      <Field orientation="horizontal">
        <Checkbox id="title-email" />
        <FieldLabel htmlFor="title-email">Email alerts</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Checkbox id="title-sms" />
        <FieldLabel htmlFor="title-sms">SMS alerts</FieldLabel>
      </Field>
    </FieldGroup>
  ),
}

/** Standalone with an input beneath. */
export const Standalone: Story = {
  render: () => (
    <Field>
      <FieldTitle>Optional Section</FieldTitle>
      <FieldContent>
        <Input placeholder="Additional notes" />
        <FieldDescription>This field is optional.</FieldDescription>
      </FieldContent>
    </Field>
  ),
}
