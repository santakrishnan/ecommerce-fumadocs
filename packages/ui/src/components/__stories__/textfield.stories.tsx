import type { Meta, StoryObj } from "@storybook/react"

import {
  Field,
  FieldError,
  FieldGroup,
  FloatingLabel,
} from "@/components/field"
import { FloatingInput } from "@/components/input"

/**
 * FloatingLabel + FloatingInput — a CSS-only floating label text field
 * composition built on Field, Input, and Label primitives.
 *
 * `FloatingLabel` (from `field.tsx`) provides the animated label that responds
 * to sibling input state via CSS peer selectors.
 *
 * `FloatingInput` (from `input.tsx`) provides the peer-enabled input with
 * placeholder fallback for `:placeholder-shown` detection.
 *
 * Both must be composed together inside a `Field` container
 * (which provides relative positioning when a `FloatingLabel` is present), with `FloatingInput` rendered
 *
 * **Out of scope:** InputGroup floating patterns
 * are not covered by these primitives. For textarea floating patterns,
 * see [Form/FloatingTextarea](?path=/docs/form-floatingtextarea--docs).
 */
const meta = {
  title: "Form/Textfield",
  component: FloatingLabel,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A CSS-only floating label system composed from FloatingLabel and FloatingInput. " +
          "The label animates between resting (centered) and floating (top, scaled-down) " +
          "positions using Tailwind peer selectors. No JavaScript state is involved.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FloatingLabel>

export default meta
type Story = StoryObj<typeof meta>

/** Default empty state — label rests centered within the input area. */
export const Default: Story = {
  render: () => (
    <Field>
      <FloatingInput id="demo-default" placeholder="Full Name" />
      <FloatingLabel htmlFor="demo-default">Full Name</FloatingLabel>
    </Field>
  ),
}

/** Filled state — label floats to the top when input has a value. */
export const Filled: Story = {
  render: () => (
    <Field>
      <FloatingInput id="demo-filled" defaultValue="Jane Doe" />
      <FloatingLabel htmlFor="demo-filled">Full Name</FloatingLabel>
    </Field>
  ),
}

/** With a real placeholder hint that appears on focus. */
export const WithPlaceholder: Story = {
  render: () => (
    <Field>
      <FloatingInput id="demo-placeholder" placeholder="xxx-xx-xxxx" />
      <FloatingLabel htmlFor="demo-placeholder">
        Social Security Number
      </FloatingLabel>
    </Field>
  ),
}

/** Invalid state — error styling via data-invalid on Field. */
export const Invalid: Story = {
  render: () => (
    <Field data-invalid="true">
      <FloatingInput
        id="demo-invalid"
        aria-invalid="true"
        defaultValue="not-an-email"
      />
      <FloatingLabel htmlFor="demo-invalid">Email Address</FloatingLabel>
      <FieldError>Please enter a valid email address.</FieldError>
    </Field>
  ),
}

/** Disabled state — reduced opacity on both input and label. */
export const Disabled: Story = {
  render: () => (
    <Field data-disabled="true">
      <FloatingInput
        id="demo-disabled"
        disabled
        defaultValue="Cannot edit"
      />
      <FloatingLabel htmlFor="demo-disabled">Locked Field</FloatingLabel>
    </Field>
  ),
}

/** Multiple floating fields composed in a FieldGroup. */
export const InFieldGroup: Story = {
  render: () => (
    <FieldGroup>
      <Field>
        <FloatingInput id="demo-first" />
        <FloatingLabel htmlFor="demo-first">First Name</FloatingLabel>
      </Field>
      <Field>
        <FloatingInput id="demo-last" />
        <FloatingLabel htmlFor="demo-last">Last Name</FloatingLabel>
      </Field>
      <Field>
        <FloatingInput id="demo-email" type="email" />
        <FloatingLabel htmlFor="demo-email">Email</FloatingLabel>
      </Field>
    </FieldGroup>
  ),
}

/** Outlined variant — bordered, white background, rounded-xl. */
export const Outlined: Story = {
  render: () => (
    <Field>
      <FloatingInput id="demo-outlined" variant="outlined" />
      <FloatingLabel htmlFor="demo-outlined">License Plate or VIN</FloatingLabel>
    </Field>
  ),
}

/** Outlined variant — filled state. */
export const OutlinedFilled: Story = {
  render: () => (
    <Field>
      <FloatingInput id="demo-outlined-filled" variant="outlined" defaultValue="ABC-1234" />
      <FloatingLabel htmlFor="demo-outlined-filled">License Plate or VIN</FloatingLabel>
    </Field>
  ),
}

/** Outlined variant — disabled state. */
export const OutlinedDisabled: Story = {
  render: () => (
    <Field data-disabled="true">
      <FloatingInput id="demo-outlined-disabled" variant="outlined" disabled defaultValue="Cannot edit" />
      <FloatingLabel htmlFor="demo-outlined-disabled">Locked Field</FloatingLabel>
    </Field>
  ),
}

/** Outlined variant — invalid state. */
export const OutlinedInvalid: Story = {
  render: () => (
    <Field data-invalid="true">
      <FloatingInput id="demo-outlined-invalid" variant="outlined" aria-invalid="true" defaultValue="bad" />
      <FloatingLabel htmlFor="demo-outlined-invalid">Email</FloatingLabel>
      <FieldError>Please enter a valid email address.</FieldError>
    </Field>
  ),
}
