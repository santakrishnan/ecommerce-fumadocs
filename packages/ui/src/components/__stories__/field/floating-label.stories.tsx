import type { Meta, StoryObj } from "@storybook/react"

import {
  Field,
  FieldError,
  FloatingLabel,
} from "@/components/field"
import { FloatingInput } from "@/components/input"

const meta = {
  title: "Form/Field/FloatingLabel",
  component: FloatingLabel,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Animated label that floats from a centered resting position to the " +
          "top of the input on focus or when the input has a value. Uses pure " +
          "CSS peer selectors — no JavaScript state. Must be rendered immediately " +
          "after `FloatingInput` inside a `Field className=\"relative\"`.\n\n" +
          "For the full Textfield composition pattern (FloatingLabel + FloatingInput), " +
          "see [Form/Textfield](?path=/docs/form-textfield--docs).\n\n" +
          "[shadcn docs](https://ui.shadcn.com/docs/components/base/field) · " +
          "[Base UI docs](https://base-ui.com/react/components/field)",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: "text",
      description: "Label text.",
    },
    htmlFor: {
      control: "text",
      description: "Must match the FloatingInput's `id` for accessibility.",
    },
  },
  args: {
    children: "Full Name",
    htmlFor: "float-demo",
  },
  render: (args) => (
    <Field className="relative">
      <FloatingInput id={args.htmlFor} placeholder=" " />
      <FloatingLabel htmlFor={args.htmlFor}>{args.children}</FloatingLabel>
    </Field>
  ),
} satisfies Meta<typeof FloatingLabel>

export default meta
type Story = StoryObj<typeof meta>

/** Default empty state — label rests centered. */
export const Default: Story = {}

/** Filled — label floats when input has a value. */
export const Filled: Story = {
  render: () => (
    <Field className="relative">
      <FloatingInput id="float-filled" placeholder=" " defaultValue="Jane Doe" />
      <FloatingLabel htmlFor="float-filled">Full Name</FloatingLabel>
    </Field>
  ),
}

/** Invalid state — error styling from parent Field. */
export const Invalid: Story = {
  render: () => (
    <Field className="relative" data-invalid="true">
      <FloatingInput
        id="float-invalid"
        placeholder=" "
        defaultValue="bad"
        aria-invalid="true"
      />
      <FloatingLabel htmlFor="float-invalid">Email</FloatingLabel>
      <FieldError>Please enter a valid email address.</FieldError>
    </Field>
  ),
}

/** Disabled state */
export const Disabled: Story = {
  render: () => (
    <Field className="relative" data-disabled="true">
      <FloatingInput
        id="float-disabled"
        placeholder=" "
        defaultValue="Cannot edit"
        disabled
      />
      <FloatingLabel htmlFor="float-disabled">Locked Field</FloatingLabel>
    </Field>
  ),
}
