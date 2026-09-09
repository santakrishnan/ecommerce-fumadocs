import type { Meta, StoryObj } from "@storybook/react"

import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/field"
import { Input } from "@/components/input"

const meta = {
  title: "Form/Field/FieldError",
  component: FieldError,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Inline validation error message. Accepts either `children` (custom content) " +
          "or an `errors` array of `{ message?: string }` objects. Handles deduplication " +
          "and gracefully ignores `undefined` entries. Renders nothing when empty.\n\n" +
          "[shadcn docs](https://ui.shadcn.com/docs/components/base/field) · " +
          "[Base UI docs](https://base-ui.com/react/components/field)",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: "text",
      description: "Custom error content (takes priority over `errors` prop).",
    },
    errors: {
      control: "object",
      description:
        "Array of error objects `{ message?: string }`. Duplicates are removed automatically.",
    },
  },
  args: {
    children: "Please enter a valid email address.",
  },
  decorators: [
    (Story) => (
      <Field data-invalid="true">
        <FieldLabel htmlFor="err-demo">Email</FieldLabel>
        <FieldContent>
          <Input
            id="err-demo"
            aria-invalid="true"
            defaultValue="not-an-email"
          />
          <Story />
        </FieldContent>
      </Field>
    ),
  ],
} satisfies Meta<typeof FieldError>

export default meta
type Story = StoryObj<typeof meta>

/** Default — simple string children. */
export const Default: Story = {
  args: { children: "Please enter a valid email address." },
}

/** Custom rich children — JSX content. */
export const CustomChildren: Story = {
  args: { children: undefined },
  render: () => (
    <FieldError>
      <span>
        This username is already taken. Try <strong>admin_123</strong> instead.
      </span>
    </FieldError>
  ),
}

/** Single error via the `errors` prop. */
export const SingleError: Story = {
  args: {
    children: undefined,
    errors: [{ message: "Must be a valid email address." }],
  },
}

/** Multiple errors — renders as a bulleted list. */
export const MultipleErrors: Story = {
  args: {
    children: undefined,
    errors: [
      { message: "Must be at least 8 characters." },
      { message: "Must contain a number." },
      { message: "Must contain a special character." },
    ],
  },
}

/** Duplicate messages — only unique ones are rendered. */
export const Deduplication: Story = {
  args: {
    children: undefined,
    errors: [
      { message: "Must be numeric." },
      { message: "Must be numeric." },
      { message: "Must be exactly 6 digits." },
    ],
  },
}

/** Undefined entries in the array — handled gracefully. */
export const UndefinedEntries: Story = {
  args: {
    children: undefined,
    errors: [
      undefined,
      { message: "Must be a valid phone number." },
      undefined,
    ],
  },
}

/** Empty errors array — renders nothing (component returns null). */
export const Empty: Story = {
  args: { children: undefined, errors: [] },
}
