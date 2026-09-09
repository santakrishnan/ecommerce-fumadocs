import type { Meta, StoryObj } from "@storybook/react"

import { Checkbox } from "@/components/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/field"
import { Input } from "@/components/input"
import { Switch } from "@/components/switch"

const meta = {
  title: "Form/Field/FieldLabel",
  component: FieldLabel,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A `<label>` element that creates an accessible association with a specific " +
          "input via `htmlFor`. Screen readers announce it when the user focuses the " +
          "input. Use it whenever you have a single control (input, checkbox, switch, select). " +
          "Responds to parent Field state (`data-invalid`, `data-disabled`) with color/opacity changes. " +
          "Supports nesting a Field inside it for choice-card patterns " +
          "(adds border + background on checked state).\n\n" +
          "[shadcn docs](https://ui.shadcn.com/docs/components/base/field) · " +
          "[Base UI docs](https://base-ui.com/react/components/field)",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: "text",
      description: "Label content.",
    },
    htmlFor: {
      control: "text",
      description: "Associates the label with an input via `id`.",
    },
    variant: {
      control: "select",
      options: ["default", "sublabel"],
      description:
        "Visual variant — `default` is semibold, `sublabel` is 12px / font-weight 400 for use under a FieldLegend.",
    },
  },
  args: {
    children: "Email Address",
    htmlFor: "label-demo",
    variant: "default",
  },
  render: (args) => (
    <Field>
      <FieldLabel htmlFor={args.htmlFor} variant={args.variant}>{args.children}</FieldLabel>
      <Input id={args.htmlFor as string} placeholder="you@example.com" />
    </Field>
  ),
} satisfies Meta<typeof FieldLabel>

export default meta
type Story = StoryObj<typeof meta>

/** Default — label above an input. */
export const Default: Story = {}

/** With a checkbox — horizontal inline pattern. */
export const WithCheckbox: Story = {
  render: () => (
    <Field orientation="horizontal">
      <Checkbox id="label-check" />
      <FieldLabel htmlFor="label-check">Accept terms</FieldLabel>
    </Field>
  ),
}

/** With a switch — horizontal inline pattern. */
export const WithSwitch: Story = {
  render: () => (
    <Field orientation="horizontal">
      <Switch id="label-switch" />
      <FieldLabel htmlFor="label-switch">Enable notifications</FieldLabel>
    </Field>
  ),
}

/** Inside FieldContent — label + description grouped together. */
export const InsideFieldContent: Story = {
  render: () => (
    <Field orientation="horizontal">
      <Checkbox id="label-content" />
      <FieldContent>
        <FieldLabel htmlFor="label-content">
          Accept terms and conditions
        </FieldLabel>
        <FieldDescription>
          You agree to our <a href="#terms">terms of service</a>.
        </FieldDescription>
      </FieldContent>
    </Field>
  ),
}

/** Invalid state — inherits destructive color from parent Field. */
export const Invalid: Story = {
  render: () => (
    <Field data-invalid="true">
      <FieldLabel htmlFor="label-invalid">Email</FieldLabel>
      <Input
        id="label-invalid"
        aria-invalid="true"
        defaultValue="bad"
      />
    </Field>
  ),
}

/** Disabled state */
export const Disabled: Story = {
  render: () => (
    <Field data-disabled="true">
      <FieldLabel htmlFor="label-disabled">Email</FieldLabel>
      <Input id="label-disabled" disabled placeholder="you@example.com" />
    </Field>
  ),
}

/** Inside a FieldSet with FieldLegend — using variant="sublabel" for 12px / font-weight 400. */
export const InsideFieldSet: Story = {
  render: () => (
    <FieldSet>
      <FieldLegend>Shipping Address</FieldLegend>
      <FieldDescription>
        Enter the address where you'd like your order delivered.
      </FieldDescription>
      <FieldGroup>
        <Field>
          <FieldLabel variant="sublabel" htmlFor="label-fs-street">Street</FieldLabel>
          <Input id="label-fs-street" placeholder="123 Main St" />
        </Field>
        <Field>
          <FieldLabel variant="sublabel" htmlFor="label-fs-city">City</FieldLabel>
          <Input id="label-fs-city" placeholder="Springfield" />
        </Field>
        <Field>
          <FieldLabel variant="sublabel" htmlFor="label-fs-zip">ZIP Code</FieldLabel>
          <Input id="label-fs-zip" placeholder="62701" />
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
}
