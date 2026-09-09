import type { Meta, StoryObj } from "@storybook/react"

import { Checkbox } from "@/components/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/field"

/**
 * Checkbox — a toggle control built on Base UI's Checkbox primitive.
 *
 * Renders a checked/unchecked state with a check icon indicator.
 * Composes inside Field for labeling and error messaging.
 */
const meta = {
  title: "Form/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A checkbox built on [Base UI Checkbox](https://base-ui.com/react/components/checkbox). " +
          "Original shadcn implementation: [shadcn/ui Checkbox (Base)](https://ui.shadcn.com/docs/components/base/checkbox).",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

/** Default checkbox with label. */
export const Default: Story = {
  render: () => (
    <FieldGroup>
      <Field orientation="horizontal">
        <Checkbox id="cb-default" />
        <FieldLabel htmlFor="cb-default">Accept terms and conditions</FieldLabel>
      </Field>
    </FieldGroup>
  ),
}

/** Checkbox with label and description. */
export const WithDescription: Story = {
  render: () => (
    <FieldGroup>
      <Field orientation="horizontal">
        <Checkbox id="cb-desc" />
        <FieldContent>
          <FieldLabel htmlFor="cb-desc">Marketing emails</FieldLabel>
          <FieldDescription>
            Receive emails about new products, features, and more.
          </FieldDescription>
        </FieldContent>
      </Field>
    </FieldGroup>
  ),
}

/** Disabled checkbox — non-interactive with reduced opacity. */
export const Disabled: Story = {
  render: () => (
    <FieldGroup>
      <Field orientation="horizontal" data-disabled>
        <Checkbox id="cb-disabled" disabled />
        <FieldLabel htmlFor="cb-disabled">Disabled option</FieldLabel>
      </Field>
    </FieldGroup>
  ),
}

/** Disabled and checked. */
export const DisabledChecked: Story = {
  render: () => (
    <FieldGroup>
      <Field orientation="horizontal" data-disabled>
        <Checkbox id="cb-disabled-checked" disabled defaultChecked />
        <FieldLabel htmlFor="cb-disabled-checked">Disabled checked option</FieldLabel>
      </Field>
    </FieldGroup>
  ),
}

/** Checkbox with error state. */
export const WithError: Story = {
  render: () => (
    <FieldGroup>
      <Field orientation="horizontal" data-invalid="true">
        <Checkbox id="cb-error" aria-invalid="true" />
        <FieldContent>
          <FieldLabel htmlFor="cb-error">Accept terms</FieldLabel>
          <FieldError>You must accept the terms to continue.</FieldError>
        </FieldContent>
      </Field>
    </FieldGroup>
  ),
}
