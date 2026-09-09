import type { Meta, StoryObj } from "@storybook/react"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FloatingLabel,
} from "@/components/field"
import { FloatingInput, Input } from "@/components/input"

/**
 * Input — a text input built on Base UI's Input primitive.
 *
 * Supports all native input types and composes within Field for
 * label, description, and error messaging.
 */
const meta = {
  title: "Form/Input",
  component: Input,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A text input built on [Base UI Input](https://base-ui.com/react/components/input). " +
          "Original shadcn implementation: [shadcn/ui Input (Base)](https://ui.shadcn.com/docs/components/base/input).",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search", "tel", "url"],
    },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
  args: {
    type: "text",
    placeholder: "Enter text...",
    disabled: false,
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

/** Default text input. */
export const Default: Story = {}

/**
 * FloatingInput — a floating label composition (FloatingInput + FloatingLabel).
 *
 * For the full Textfield pattern with more examples (filled, invalid, disabled, grouped),
 * see [Form/Textfield](?path=/docs/form-textfield--docs).
 */
export const FloatingInputPrimitive: Story = {
  render: () => (
    <Field className="relative">
      <FloatingInput id="input-floating" placeholder=" " />
      <FloatingLabel htmlFor="input-floating">Full Name</FloatingLabel>
    </Field>
  ),
}

/** Email type input. */
export const Email: Story = {
  args: { type: "email", placeholder: "you@example.com" },
}

/** Password type input. */
export const Password: Story = {
  args: { type: "password", placeholder: "••••••••" },
}

/** Disabled input — non-interactive with reduced opacity. */
export const Disabled: Story = {
  args: { disabled: true, placeholder: "Disabled input" },
}

/** Input with aria-invalid for error styling. */
export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "bad value" },
}

/** Input composed inside a Field with label and description. */
export const WithField: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="field-input">Email</FieldLabel>
      <FieldContent>
        <Input id="field-input" type="email" placeholder="you@example.com" />
        <FieldDescription>We'll never share your email.</FieldDescription>
      </FieldContent>
    </Field>
  ),
}

/** Input composed inside a Field with error state. */
export const WithFieldError: Story = {
  render: () => (
    <Field data-invalid="true">
      <FieldLabel htmlFor="error-field-input">Email</FieldLabel>
      <FieldContent>
        <Input
          id="error-field-input"
          type="email"
          aria-invalid="true"
          defaultValue="not-valid"
        />
        <FieldError>Please enter a valid email address.</FieldError>
      </FieldContent>
    </Field>
  ),
}

/** File input variant. */
export const File: Story = {
  args: { type: "file" },
}
