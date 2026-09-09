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
import { Input } from "@/components/input"

const meta = {
  title: "Form/Field/FieldContent",
  component: FieldContent,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A flex container that wraps the input and its helper elements " +
          "(FieldDescription, FieldError) with consistent vertical spacing. " +
          "Inherits disabled pointer-events from the parent Field.\n\n" +
          "[shadcn docs](https://ui.shadcn.com/docs/components/base/field) · " +
          "[Base UI docs](https://base-ui.com/react/components/field)",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      table: { disable: true },
    },
  },
} satisfies Meta<typeof FieldContent>

export default meta
type Story = StoryObj<typeof meta>

/** Default — input + description inside FieldContent. */
export const Default: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="content-default">Username</FieldLabel>
      <FieldContent>
        <Input id="content-default" placeholder="johndoe" />
        <FieldDescription>This is your public display name.</FieldDescription>
      </FieldContent>
    </Field>
  ),
}

/** With description + error — full helper stack. */
export const WithError: Story = {
  render: () => (
    <Field data-invalid="true">
      <FieldLabel htmlFor="content-error">Email</FieldLabel>
      <FieldContent>
        <Input
          id="content-error"
          aria-invalid="true"
          defaultValue="not-valid"
        />
        <FieldDescription>
          We'll send a confirmation to this address.
        </FieldDescription>
        <FieldError>Please enter a valid email address.</FieldError>
      </FieldContent>
    </Field>
  ),
}

/** Horizontal with checkbox — label + description grouped. */
export const HorizontalCheckbox: Story = {
  render: () => (
    <Field orientation="horizontal">
      <Checkbox id="content-horiz" />
      <FieldContent>
        <FieldLabel htmlFor="content-horiz">
          Accept terms and conditions
        </FieldLabel>
        <FieldDescription>
          You agree to our <a href="#terms">terms of service</a> and{" "}
          <a href="#privacy">privacy policy</a>.
        </FieldDescription>
      </FieldContent>
    </Field>
  ),
}

/** Horizontal with error state. */
export const HorizontalError: Story = {
  render: () => (
    <Field orientation="horizontal" data-invalid="true">
      <Checkbox id="content-horiz-err" aria-invalid="true" />
      <FieldContent>
        <FieldLabel htmlFor="content-horiz-err">
          Accept terms and conditions
        </FieldLabel>
        <FieldDescription>You must accept to continue.</FieldDescription>
        <FieldError>This field is required.</FieldError>
      </FieldContent>
    </Field>
  ),
}

/** Responsive orientation — full stack inside FieldContent. */
export const Responsive: Story = {
  render: () => (
    <FieldGroup>
      <Field orientation="responsive" data-invalid="true">
        <FieldLabel htmlFor="content-resp">Company Name</FieldLabel>
        <FieldContent>
          <Input id="content-resp" aria-invalid="true" defaultValue="" />
          <FieldDescription>Your registered business name.</FieldDescription>
          <FieldError>Company name is required.</FieldError>
        </FieldContent>
      </Field>
    </FieldGroup>
  ),
}
