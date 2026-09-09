import type { Meta, StoryObj } from "@storybook/react"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/field"
import { Input } from "@/components/input"

interface FieldStoryArgs {
  orientation: "vertical" | "horizontal" | "responsive"
  invalid: boolean
  disabled: boolean
}

const meta: Meta<FieldStoryArgs> = {
  title: "Form/Field/Field",
  component: Field,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The root container for a single form field. Controls orientation " +
          "(`vertical` | `horizontal` | `responsive`) and propagates " +
          "`data-invalid` / `data-disabled` state to children via data attributes.\n\n" +
          "[shadcn docs](https://ui.shadcn.com/docs/components/base/field) · " +
          "[Base UI docs](https://base-ui.com/react/components/field)",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["vertical", "horizontal", "responsive"],
      description: "Layout direction of the field.",
    },
    invalid: {
      control: "boolean",
      description:
        "Sets `data-invalid=\"true\"` on Field — propagates error styling to children.",
    },
    disabled: {
      control: "boolean",
      description:
        "Sets `data-disabled=\"true\"` on Field — dims children and disables input.",
    },
  },
  args: {
    orientation: "vertical",
    invalid: false,
    disabled: false,
  },
  render: (args) => (
    <FieldGroup>
      <Field
        orientation={args.orientation}
        data-invalid={args.invalid ? "true" : undefined}
        data-disabled={args.disabled ? "true" : undefined}
      >
        <FieldLabel htmlFor="field-demo">Email</FieldLabel>
        <FieldContent>
          <Input
            id="field-demo"
            type="email"
            placeholder="you@example.com"
            defaultValue="not-valid"
            disabled={args.disabled}
            aria-invalid={args.invalid ? true : undefined}
          />
          <FieldDescription>
            We'll send a confirmation to this address.
          </FieldDescription>
          {args.invalid && (
            <FieldError>Please enter a valid email address.</FieldError>
          )}
        </FieldContent>
      </Field>
    </FieldGroup>
  ),
}

export default meta
type Story = StoryObj<typeof meta>

/** Default vertical layout. */
export const Default: Story = {}

/** Horizontal — label and input side by side. */
export const Horizontal: Story = {
  args: { orientation: "horizontal" },
}

/** Responsive — vertical at narrow, horizontal at wide container. */
export const Responsive: Story = {
  args: { orientation: "responsive" },
}

/** Invalid state — error styling propagated to children. */
export const Invalid: Story = {
  args: { invalid: true },
}

/** Disabled state — dims all child elements. */
export const Disabled: Story = {
  args: { disabled: true },
}
