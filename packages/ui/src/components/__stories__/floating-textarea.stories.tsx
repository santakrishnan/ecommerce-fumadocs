import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FloatingLabel,
} from "@/components/field"
import { FloatingTextarea } from "@/components/textarea"

/**
 * FloatingLabel + FloatingTextarea — a CSS-only floating label textarea
 * composition built on Field and Label primitives.
 *
 * `FloatingLabel` (from `field.tsx`) provides the animated label that responds
 * to sibling textarea state via CSS peer selectors (`:placeholder-shown`, `:focus`).
 *
 * `FloatingTextarea` (from `textarea.tsx`) provides the peer-enabled textarea with
 * placeholder fallback for `:placeholder-shown` detection. It auto-grows with content
 * via `field-sizing-content` — no fixed height is imposed.
 *
 * Both must be composed together inside a `Field` container
 * (which auto-applies `position: relative` when a `FloatingLabel` child is present),
 * with `FloatingTextarea` rendered **before** `FloatingLabel` in DOM order.
 *
 * **Peer selector mechanism:** The `FloatingTextarea` applies the `peer` Tailwind class.
 * `FloatingLabel` uses `peer-focus:*` and `peer-[:not(:placeholder-shown)]:*` selectors
 * to animate between resting (centered) and floating (top, scaled-down) positions.
 * No JavaScript state is involved.
 */
const meta = {
  title: "Form/FloatingTextarea",
  component: FloatingTextarea,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A CSS-only floating label textarea system composed from FloatingLabel and FloatingTextarea. " +
          "The label animates between resting (centered) and floating (top, scaled-down) " +
          "positions using Tailwind peer selectors. Uses `field-sizing-content` to auto-grow with content.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
    defaultValue: { control: "text" },
    variant: {
      control: "select",
      options: ["default", "outlined"],
      description: "Visual variant of the FloatingTextarea.",
    },
  },
  args: {
    id: "floating-textarea",
    disabled: false,
    variant: "default",
  },
} satisfies Meta<typeof FloatingTextarea>

export default meta
type Story = StoryObj<typeof meta>

/** Default empty state — label rests centered within the textarea area. */
export const FloatingDefault: Story = {
  render: (args) => (
    <Field>
      <FloatingTextarea {...args} />
      <FloatingLabel htmlFor="floating-textarea">Add note</FloatingLabel>
    </Field>
  ),
}

/** Filled state — label floats to the top when textarea has a value. */
export const FloatingFilled: Story = {
  args: {
    defaultValue:
      "Overall, this feels like a genuinely solid contender — one of those vehicles that hits a good balance across the three things that matter most to me: price, features, and practicality.",
  },
  render: (args) => (
    <Field>
      <FloatingTextarea {...args} />
      <FloatingLabel htmlFor="floating-textarea">Add note</FloatingLabel>
    </Field>
  ),
}

/** Disabled state — reduced opacity on both textarea and label. */
export const FloatingDisabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Cannot edit this note",
  },
  render: (args) => (
    <Field data-disabled="true">
      <FloatingTextarea {...args} />
      <FloatingLabel htmlFor="floating-textarea">Add note</FloatingLabel>
    </Field>
  ),
}

/** Error/invalid state — destructive border and label styling via aria-invalid and data-invalid. */
export const FloatingError: Story = {
  args: {
    "aria-invalid": true,
  },
  render: (args) => (
    <Field data-invalid="true">
      <FloatingTextarea {...args} />
      <FloatingLabel htmlFor="floating-textarea">Add note</FloatingLabel>
      <FieldError>Note must be at least 10 characters.</FieldError>
    </Field>
  ),
}

/** Multi-line content demonstrating auto-sizing via field-sizing-content. */
export const FloatingWithContent: Story = {
  args: {
    defaultValue:
      "Overall, this feels like a genuinely solid contender — one of those vehicles that hits a good balance across the three things that matter most to me: price, features, and practicality. It's not the cheapest option out there, but it doesn't feel like I'm paying for things I don't need either. The pricing seems fair relative to what's included, and I'm not left with that nagging sense of being upsold on features I'll never touch.",
  },
  render: (args) => (
    <Field>
      <FloatingTextarea {...args} />
      <FloatingLabel htmlFor="floating-textarea">Add note</FloatingLabel>
    </Field>
  ),
}

/** Complete composition with Field, FieldLabel, FloatingTextarea, and FieldDescription. */
export const FloatingWithField: Story = {
  render: (args) => (
    <Field>
      <FieldLabel htmlFor="floating-textarea">Notes</FieldLabel>
      <Field>
        <FloatingTextarea {...args} />
        <FloatingLabel htmlFor="floating-textarea">Add note</FloatingLabel>
      </Field>
      <FieldDescription>
        Add any relevant notes about your experience.
      </FieldDescription>
    </Field>
  ),
}

/** Multiple FloatingTextareas composed within a FieldGroup. */
export const FloatingInFieldGroup: Story = {
  render: (args) => (
    <FieldGroup>
      <Field>
        <FloatingTextarea {...args} id="floating-group-1" />
        <FloatingLabel htmlFor="floating-group-1">
          First impression
        </FloatingLabel>
      </Field>
      <Field>
        <FloatingTextarea {...args} id="floating-group-2" />
        <FloatingLabel htmlFor="floating-group-2">
          Test drive notes
        </FloatingLabel>
      </Field>
      <Field>
        <FloatingTextarea {...args} id="floating-group-3" />
        <FloatingLabel htmlFor="floating-group-3">
          Final thoughts
        </FloatingLabel>
      </Field>
    </FieldGroup>
  ),
}

/** FloatingTextarea with a live character count — demonstrates error composition
 * (aria-invalid + data-invalid) triggering destructive styling on textarea, label, and description. */
export const FloatingWithCharacterCount: Story = {
  parameters: {
    docs: {
      source: {
        code: `
const MAX_LENGTH = 500

function NoteField() {
  const [length, setLength] = useState(0)
  const isAtLimit = length >= MAX_LENGTH

  return (
    <Field data-invalid={isAtLimit ? "true" : undefined}>
      <Field>
        <FloatingTextarea
          id="floating-char-count"
          maxLength={MAX_LENGTH}
          aria-invalid={isAtLimit || undefined}
          onChange={(e) => setLength(e.target.value.length)}
        />
        <FloatingLabel htmlFor="floating-char-count">Add note</FloatingLabel>
      </Field>
      <FieldDescription
        className={isAtLimit ? "text-right text-destructive" : "text-right"}
      >
        {length}/{MAX_LENGTH}
      </FieldDescription>
    </Field>
  )
}
        `.trim(),
        language: "tsx",
      },
    },
  },
  render: function Render(args) {
    const maxLength = 500
    const initialLength =
      typeof args.defaultValue === "string" ? args.defaultValue.length : 0
    const [length, setLength] = useState(initialLength)
    const isAtLimit = length >= maxLength

    return (
      <Field data-invalid={isAtLimit ? "true" : undefined}>
        <Field>
          <FloatingTextarea
            {...args}
            id="floating-char-count"
            maxLength={maxLength}
            aria-invalid={isAtLimit || undefined}
            onChange={(e) => setLength(e.target.value.length)}
          />
          <FloatingLabel htmlFor="floating-char-count">Add note</FloatingLabel>
        </Field>
        <FieldDescription
          className={isAtLimit ? "text-right text-destructive" : "text-right"}
        >
          {length}/{maxLength}
        </FieldDescription>
      </Field>
    )
  },
}

/** With a real placeholder hint that appears on focus. */
export const FloatingWithPlaceholder: Story = {
  args: {
    placeholder: "Describe your experience in detail...",
  },
  render: (args) => (
    <Field>
      <FloatingTextarea {...args} />
      <FloatingLabel htmlFor="floating-textarea">Add note</FloatingLabel>
    </Field>
  ),
}

/** Outlined variant — bordered, white background style. */
export const FloatingOutlined: Story = {
  args: { variant: "outlined" },
  render: (args) => (
    <Field>
      <FloatingTextarea {...args} />
      <FloatingLabel htmlFor="floating-textarea">Add note</FloatingLabel>
    </Field>
  ),
}

/** Outlined variant — filled state. */
export const FloatingOutlinedFilled: Story = {
  args: {
    variant: "outlined",
    defaultValue:
      "Overall, this feels like a genuinely solid contender — one of those vehicles that hits a good balance across the three things that matter most to me.",
  },
  render: (args) => (
    <Field>
      <FloatingTextarea {...args} />
      <FloatingLabel htmlFor="floating-textarea">Add note</FloatingLabel>
    </Field>
  ),
}

/** Outlined variant — disabled state. */
export const FloatingOutlinedDisabled: Story = {
  args: {
    variant: "outlined",
    disabled: true,
    defaultValue: "Cannot edit this note",
  },
  render: (args) => (
    <Field data-disabled="true">
      <FloatingTextarea {...args} />
      <FloatingLabel htmlFor="floating-textarea">Add note</FloatingLabel>
    </Field>
  ),
}

/** Outlined variant — invalid state. */
export const FloatingOutlinedError: Story = {
  args: {
    variant: "outlined",
    "aria-invalid": true,
  },
  render: (args) => (
    <Field data-invalid="true">
      <FloatingTextarea {...args} />
      <FloatingLabel htmlFor="floating-textarea">Add note</FloatingLabel>
      <FieldError>Note must be at least 10 characters.</FieldError>
    </Field>
  ),
}
