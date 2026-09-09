import type { Meta, StoryObj } from "@storybook/react"

import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  FloatingLabel
} from "@/components/field"
import {
  FloatingSelectTrigger,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/select"

/**
 * Select — a dropdown select built on Base UI's Select primitive.
 *
 * Uses a portal-based positioner with scroll arrows and
 * supports grouped items with labels.
 */
const meta = {
  title: "Form/Select",
  component: Select,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A dropdown select built on [Base UI Select](https://base-ui.com/react/components/select). " +
          "Original shadcn implementation: [shadcn/ui Select (Base)](https://ui.shadcn.com/docs/components/base/select).",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Floating Select — a Select composed with a floating label that animates
 * between resting and lifted positions based on open state and value presence.
 */
export const FloatingDefault: Story = {
  render: () => (
    <Field>
      <Select>
        <FloatingSelectTrigger>
          <SelectValue placeholder="Select a fruit" />
        </FloatingSelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="cherry">Cherry</SelectItem>
        </SelectContent>
      </Select>
      <FloatingLabel>Fruit</FloatingLabel>
    </Field>
  ),
}

/** Floating Select Filled state — label floats to the top when a value is pre-selected. */
export const FloatingWithDefaultValue: Story = {
  render: () => (
    <Field>
      <Select defaultValue="banana">
        <FloatingSelectTrigger>
          <SelectValue placeholder="Select a fruit" />
        </FloatingSelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="cherry">Cherry</SelectItem>
        </SelectContent>
      </Select>
      <FloatingLabel>Fruit</FloatingLabel>
    </Field>
  ),
}

/** Floating Select Disabled state */
export const FloatingDisabled: Story = {
  render: () => (
    <Field>
      <Select disabled>
        <FloatingSelectTrigger>
          <SelectValue placeholder="Select a fruit" />
        </FloatingSelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="cherry">Cherry</SelectItem>
        </SelectContent>
      </Select>
      <FloatingLabel>Fruit</FloatingLabel>
    </Field>
  ),
}

/** Floating Select Error state — destructive border and label color. */
export const FloatingError: Story = {
  render: () => (
    <Field data-invalid="true">
      <Select>
        <FloatingSelectTrigger aria-invalid="true">
          <SelectValue placeholder="Select a fruit" />
        </FloatingSelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="cherry">Cherry</SelectItem>
        </SelectContent>
      </Select>
      <FloatingLabel>Fruit</FloatingLabel>
      <FieldError>Please select a fruit.</FieldError>
    </Field>
  ),
}

/** Floating Select — outlined variant with bordered, white background style. */
export const FloatingOutlined: Story = {
  render: () => (
    <Field>
      <Select>
        <FloatingSelectTrigger variant="outlined">
          <SelectValue placeholder="Select a fruit" />
        </FloatingSelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="cherry">Cherry</SelectItem>
        </SelectContent>
      </Select>
      <FloatingLabel>Fruit</FloatingLabel>
    </Field>
  ),
}

/** Floating Select — outlined variant with a pre-selected value. */
export const FloatingOutlinedWithValue: Story = {
  render: () => (
    <Field>
      <Select defaultValue="banana">
        <FloatingSelectTrigger variant="outlined">
          <SelectValue placeholder="Select a fruit" />
        </FloatingSelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="cherry">Cherry</SelectItem>
        </SelectContent>
      </Select>
      <FloatingLabel>Fruit</FloatingLabel>
    </Field>
  ),
}

/** Floating Select — outlined variant in disabled state. */
export const FloatingOutlinedDisabled: Story = {
  render: () => (
    <Field>
      <Select disabled>
        <FloatingSelectTrigger variant="outlined">
          <SelectValue placeholder="Select a fruit" />
        </FloatingSelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="cherry">Cherry</SelectItem>
        </SelectContent>
      </Select>
      <FloatingLabel>Fruit</FloatingLabel>
    </Field>
  ),
}

/** Floating Select — outlined variant in error state. */
export const FloatingOutlinedError: Story = {
  render: () => (
    <Field data-invalid="true">
      <Select>
        <FloatingSelectTrigger variant="outlined" aria-invalid="true">
          <SelectValue placeholder="Select a fruit" />
        </FloatingSelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="cherry">Cherry</SelectItem>
        </SelectContent>
      </Select>
      <FloatingLabel>Fruit</FloatingLabel>
      <FieldError>Please select a fruit.</FieldError>
    </Field>
  ),
}

/** Primitive Select with a few options. */
export const PrimitiveRoot: Story = {
  render: () => (
    <Select defaultValue="banana">
      <SelectTrigger>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="cherry">Cherry</SelectItem>
        <SelectItem value="date">Date</SelectItem>
      </SelectContent>
    </Select>
  ),
}

/** Primitive Select with placeholder (no default value). */
export const PrimitiveWithPlaceholder: Story = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Choose an option..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="one">Option One</SelectItem>
        <SelectItem value="two">Option Two</SelectItem>
        <SelectItem value="three">Option Three</SelectItem>
      </SelectContent>
    </Select>
  ),
}

/** Primitive Select with grouped items. */
export const PrimitiveGrouped: Story = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a food" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          <SelectItem value="carrot">Carrot</SelectItem>
          <SelectItem value="broccoli">Broccoli</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}

/** Primitive Select disabled state — trigger is non-interactive. */
export const PrimitiveDisabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger disabled>
        <SelectValue placeholder="Disabled" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="one">Option One</SelectItem>
      </SelectContent>
    </Select>
  ),
}

/** Primitive Select small size trigger variant. */
export const PrimitiveSmallSize: Story = {
  render: () => (
    <Select defaultValue="small">
      <SelectTrigger>
        <SelectValue placeholder="Small trigger" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="small">Small</SelectItem>
        <SelectItem value="default">Default</SelectItem>
      </SelectContent>
    </Select>
  ),
}

/** Primitive Select composed inside a Field with label. */
export const PrimitiveWithField: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="select-timezone">Timezone</FieldLabel>
      <Select defaultValue="est">
        <SelectTrigger id="select-timezone">
          <SelectValue placeholder="Select timezone" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="est">Eastern (EST)</SelectItem>
          <SelectItem value="cst">Central (CST)</SelectItem>
          <SelectItem value="mst">Mountain (MST)</SelectItem>
          <SelectItem value="pst">Pacific (PST)</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  ),
}

/** Primitive Select with error state composed in a Field. */
export const PrimitiveWithFieldError: Story = {
  render: () => (
    <Field data-invalid="true">
      <FieldLabel htmlFor="select-country">Country</FieldLabel>
      <FieldContent>
        <Select>
          <SelectTrigger id="select-country" aria-invalid="true">
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="uk">United Kingdom</SelectItem>
            <SelectItem value="ca">Canada</SelectItem>
          </SelectContent>
        </Select>
        <FieldError>Please select a country.</FieldError>
      </FieldContent>
    </Field>
  ),
}
