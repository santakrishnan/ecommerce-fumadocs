import type { Meta, StoryObj } from "@storybook/react"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldTitle,
} from "@/components/field"
import { NumberField } from "@/components/number-field"

/**
 * NumberField — a numeric input with increment/decrement controls
 * built on Base UI's NumberField primitive.
 *
 * Renders decrement, input, and increment buttons by default when
 * no children are provided.
 */
const meta = {
  title: "Form - WIP/NumberField",
  component: NumberField,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A number input with stepper controls built on [Base UI NumberField](https://base-ui.com/react/components/number-field). " +
          "Renders increment/decrement buttons by default.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
  },
  args: {
    disabled: false,
  },
} satisfies Meta<typeof NumberField>

export default meta
type Story = StoryObj<typeof meta>

/** Default number field with stepper buttons. */
export const Default: Story = {}

/** Number field with a default value. */
export const WithDefaultValue: Story = {
  args: { defaultValue: 5 },
}

/** Number field with min and max bounds. */
export const WithMinMax: Story = {
  args: { min: 0, max: 10, defaultValue: 3 },
}

/** Number field with step increment. */
export const WithStep: Story = {
  args: { step: 5, defaultValue: 10 },
}

/** Disabled number field — all controls non-interactive. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: 7 },
}

/** Number field composed inside a Field with title. */
export const WithField: Story = {
  render: () => (
    <Field>
      <FieldTitle>Quantity</FieldTitle>
      <NumberField min={1} max={99} defaultValue={1} />
    </Field>
  ),
}

/** Number field with description. */
export const WithDescription: Story = {
  render: () => (
    <Field>
      <FieldTitle>Guests</FieldTitle>
      <FieldContent>
        <NumberField min={1} max={20} defaultValue={2} />
        <FieldDescription>Maximum 20 guests per reservation.</FieldDescription>
      </FieldContent>
    </Field>
  ),
}

/** Number field with error state. */
export const WithFieldError: Story = {
  render: () => (
    <Field data-invalid="true">
      <FieldTitle>Amount</FieldTitle>
      <FieldContent>
        <NumberField defaultValue={-1} aria-invalid="true" />
        <FieldError>Amount must be a positive number.</FieldError>
      </FieldContent>
    </Field>
  ),
}
