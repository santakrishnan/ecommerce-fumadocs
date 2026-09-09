import type { Meta, StoryObj } from "@storybook/react"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/field"
import { RadioGroup, RadioGroupItem } from "@/components/radio-group"

/**
 * RadioGroup — a group of mutually exclusive radio options built on Base UI.
 *
 * Uses RadioGroup as the container and RadioGroupItem for each option.
 * Composes inside Field/FieldSet for accessible labeling.
 */
const meta = {
  title: "Form/RadioGroup",
  component: RadioGroup,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A radio group built on [Base UI Radio](https://base-ui.com/react/components/radio). " +
          "Original shadcn implementation: [shadcn/ui RadioGroup (Base)](https://ui.shadcn.com/docs/components/base/radio-group).",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

/** Default radio group with three options. */
export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option-1">
      <Field orientation="horizontal">
        <RadioGroupItem value="option-1" id="rg-1" />
        <FieldLabel htmlFor="rg-1">Option One</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <RadioGroupItem value="option-2" id="rg-2" />
        <FieldLabel htmlFor="rg-2">Option Two</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <RadioGroupItem value="option-3" id="rg-3" />
        <FieldLabel htmlFor="rg-3">Option Three</FieldLabel>
      </Field>
    </RadioGroup>
  ),
}

/** Disabled radio group — all items non-interactive. You must put data-disabled on Field. */
export const Disabled: Story = {
  render: () => (
    <RadioGroup disabled defaultValue="option-1">
      <Field orientation="horizontal" data-disabled="true">
        <RadioGroupItem value="option-1" id="rg-dis-1" />
        <FieldLabel htmlFor="rg-dis-1">Option One</FieldLabel>
      </Field>
      <Field orientation="horizontal" data-disabled="true">
        <RadioGroupItem value="option-2" id="rg-dis-2" />
        <FieldLabel htmlFor="rg-dis-2">Option Two</FieldLabel>
      </Field>
    </RadioGroup>
  ),
}

/** Radio group with descriptions per option. */
export const WithDescriptions: Story = {
  render: () => (
    <RadioGroup defaultValue="email">
      <Field orientation="horizontal">
        <RadioGroupItem value="email" id="rg-desc-email" />
        <FieldContent>
          <FieldLabel htmlFor="rg-desc-email">Email</FieldLabel>
          <FieldDescription>Receive updates via email.</FieldDescription>
        </FieldContent>
      </Field>
      <Field orientation="horizontal">
        <RadioGroupItem value="sms" id="rg-desc-sms" />
        <FieldContent>
          <FieldLabel htmlFor="rg-desc-sms">SMS</FieldLabel>
          <FieldDescription>Get text message alerts.</FieldDescription>
        </FieldContent>
      </Field>
      <Field orientation="horizontal">
        <RadioGroupItem value="push" id="rg-desc-push" />
        <FieldContent>
          <FieldLabel htmlFor="rg-desc-push">Push</FieldLabel>
          <FieldDescription>Instant notifications on your device.</FieldDescription>
        </FieldContent>
      </Field>
    </RadioGroup>
  ),
}

/** Radio group inside a FieldSet with legend. */
export const WithFieldSet: Story = {
  render: () => (
    <FieldSet>
      <FieldLegend>Notification preference</FieldLegend>
      <RadioGroup defaultValue="email">
        <Field orientation="horizontal">
          <RadioGroupItem value="email" id="rg-fs-email" />
          <FieldLabel htmlFor="rg-fs-email">Email</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem value="sms" id="rg-fs-sms" />
          <FieldLabel htmlFor="rg-fs-sms">SMS</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem value="push" id="rg-fs-push" />
          <FieldLabel htmlFor="rg-fs-push">Push notification</FieldLabel>
        </Field>
      </RadioGroup>
    </FieldSet>
  ),
}

/** Radio group with error state. You must put data-invalid on the Field and then aria-invalid on the RadioGroupItem. */
export const WithError: Story = {
  render: () => (
    <FieldSet>
      <FieldLegend>Select a plan</FieldLegend>
      <RadioGroup>
        <Field orientation="horizontal" data-invalid="true">
          <RadioGroupItem value="free" id="rg-err-free" aria-invalid="true" />
          <FieldLabel htmlFor="rg-err-free">Free</FieldLabel>
        </Field>
        <Field orientation="horizontal" data-invalid="true">
          <RadioGroupItem value="pro" id="rg-err-pro" aria-invalid="true" />
          <FieldLabel htmlFor="rg-err-pro">Pro</FieldLabel>
        </Field>
      </RadioGroup>
      <FieldError>Please select a plan to continue.</FieldError>
    </FieldSet>
  ),
}
