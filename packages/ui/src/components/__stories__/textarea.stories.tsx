import type { Meta, StoryObj } from "@storybook/react"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FloatingLabel,
} from "@/components/field"
import { FloatingTextarea, Textarea } from "@/components/textarea"

/**
 * Textarea — an auto-sizing textarea with field-sizing-content.
 *
 * Supports all native textarea props and composes within Field
 * for label, description, and error messaging.
 *
 * For the floating label pattern, see
 * [Form/FloatingTextarea](?path=/docs/form-floatingtextarea--docs).
 */
const meta = {
  title: "Form/Textarea",
  component: Textarea,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A textarea with intrinsic auto-sizing via `field-sizing-content`. " +
          "Supports disabled and invalid states with visual feedback.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
  args: {
    placeholder: "Type your message here...",
    disabled: false,
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

/** Default textarea. */
export const Default: Story = {}

/**
 * FloatingTextarea — a floating label composition (FloatingTextarea + FloatingLabel).
 *
 * For the full FloatingTextarea pattern with more examples (filled, invalid, disabled, grouped),
 * see [Form/FloatingTextarea](?path=/docs/form-floatingtextarea--docs).
 */
export const FloatingTextareaPrimitive: Story = {
  render: () => (
    <Field>
      <FloatingTextarea id="textarea-floating" />
      <FloatingLabel htmlFor="textarea-floating">Add note</FloatingLabel>
    </Field>
  ),
}

/** Disabled textarea — non-interactive with reduced opacity. */
export const Disabled: Story = {
  args: { disabled: true, placeholder: "Disabled textarea" },
}

/** Textarea with aria-invalid for error styling. */
export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "Invalid content" },
}

/** Textarea with pre-filled content demonstrating auto-sizing. */
export const WithContent: Story = {
  args: {
    defaultValue:
      "This textarea uses field-sizing-content to automatically grow with its content. Try adding more lines to see it expand.",
  },
}

/** Textarea composed inside a Field with label and description. */
export const WithField: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="field-textarea">Bio</FieldLabel>
      <FieldContent>
        <Textarea id="field-textarea" placeholder="Tell us about yourself..." />
        <FieldDescription>Maximum 500 characters.</FieldDescription>
      </FieldContent>
    </Field>
  ),
}

/** Textarea composed inside a Field with error state. */
export const WithFieldError: Story = {
  render: () => (
    <Field data-invalid="true">
      <FieldLabel htmlFor="error-textarea">Message</FieldLabel>
      <FieldContent>
        <Textarea
          id="error-textarea"
          aria-invalid="true"
        />
        <FieldError>Message must be at least 10 characters.</FieldError>
      </FieldContent>
    </Field>
  ),
}
