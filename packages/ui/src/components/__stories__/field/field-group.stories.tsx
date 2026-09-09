import type { Meta, StoryObj } from "@storybook/react"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/field"
import { Input } from "@/components/input"

const meta = {
  title: "Form/Field/FieldGroup",
  component: FieldGroup,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A container that lays out `Field` children in vertical or horizontal orientations with consistent spacing. " +
          "Also provides `@container/field-group` for responsive orientation queries.\n\n" +
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
} satisfies Meta<typeof FieldGroup>

export default meta
type Story = StoryObj<typeof meta>

/** Default — two fields stacked vertically. */
export const Default: Story = {
  render: () => (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="group-1">First Name</FieldLabel>
        <Input id="group-1" placeholder="Jane" />
      </Field>
      <Field>
        <FieldLabel htmlFor="group-2">Last Name</FieldLabel>
        <Input id="group-2" placeholder="Doe" />
      </Field>
    </FieldGroup>
  ),
}

/** Horizontal — fields align in rows and wrap when needed. */
export const Horizontal: Story = {
  render: () => (
    <FieldGroup orientation="horizontal">
      <Field className="min-w-48 flex-1">
        <FieldLabel htmlFor="group-horizontal-1">Min Price</FieldLabel>
        <Input id="group-horizontal-1" placeholder="$0" />
      </Field>
      <Field className="min-w-48 flex-1">
        <FieldLabel htmlFor="group-horizontal-2">Max Price</FieldLabel>
        <Input id="group-horizontal-2" placeholder="$50,000" />
      </Field>
      <Field className="min-w-48 flex-1">
        <FieldLabel htmlFor="group-horizontal-3">Max Mileage</FieldLabel>
        <Input id="group-horizontal-3" placeholder="100,000" />
      </Field>
    </FieldGroup>
  ),
}

/** With a separator between fields. */
export const WithSeparator: Story = {
  render: () => (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="group-sep-1">Email</FieldLabel>
        <Input id="group-sep-1" type="email" placeholder="you@example.com" />
      </Field>
      <FieldSeparator>or</FieldSeparator>
      <Field>
        <FieldLabel htmlFor="group-sep-2">Phone</FieldLabel>
        <Input id="group-sep-2" type="tel" placeholder="(555) 123-4567" />
      </Field>
    </FieldGroup>
  ),
}

/** Responsive fields — orientation switches based on container width. */
export const Responsive: Story = {
  render: () => (
    <FieldGroup>
      <Field orientation="responsive">
        <FieldLabel htmlFor="group-resp-1">Name</FieldLabel>
        <FieldContent>
          <Input id="group-resp-1" placeholder="Jane Doe" />
          <FieldDescription>
            Resize viewport to see layout switch.
          </FieldDescription>
        </FieldContent>
      </Field>
      <Field orientation="responsive">
        <FieldLabel htmlFor="group-resp-2">Email</FieldLabel>
        <FieldContent>
          <Input
            id="group-resp-2"
            type="email"
            placeholder="you@example.com"
          />
        </FieldContent>
      </Field>
    </FieldGroup>
  ),
}

/** Nested groups — mixed orientations preserve spacing and wrap behavior. */
export const NestedGroups: Story = {
  render: () => (
    <div className="grid gap-8">
      <section className="grid gap-4">
        <div>
          <h4 className="text-sm font-semibold text-text-primary">
            Outer vertical, inner horizontal
          </h4>
          <p className="text-sm text-text-secondary">
            The inner group should keep its row layout while the outer group
            keeps stacked spacing.
          </p>
        </div>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="group-nested-0">Search Name</FieldLabel>
            <Input id="group-nested-0" placeholder="Weekend SUVs" />
          </Field>
          <Field>
            <FieldLabel>Deal details</FieldLabel>
            <FieldGroup orientation="horizontal">
              <Field className="min-w-40 flex-1">
                <FieldLabel htmlFor="group-nested-1">Min Price</FieldLabel>
                <Input id="group-nested-1" placeholder="$0" />
              </Field>
              <Field className="min-w-40 flex-1">
                <FieldLabel htmlFor="group-nested-2">Max Price</FieldLabel>
                <Input id="group-nested-2" placeholder="$50,000" />
              </Field>
            </FieldGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="group-nested-2b">ZIP Code</FieldLabel>
            <Input id="group-nested-2b" placeholder="91711" />
          </Field>
        </FieldGroup>
      </section>

      <section className="grid gap-4">
        <div>
          <h4 className="text-sm font-semibold text-text-primary">
            Outer horizontal, inner vertical
          </h4>
          <p className="text-sm text-text-secondary">
            The outer group wraps across columns while the inner group keeps a
            stacked form layout.
          </p>
        </div>
        <FieldGroup orientation="horizontal">
          <Field className="min-w-80 flex-1">
            <FieldLabel>Trade-in comparison</FieldLabel>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="group-nested-3">Plate or VIN</FieldLabel>
                <Input id="group-nested-3" placeholder="XYZ5678" />
              </Field>
              <Field>
                <FieldLabel htmlFor="group-nested-4">State</FieldLabel>
                <Input id="group-nested-4" placeholder="NY" />
              </Field>
            </FieldGroup>
          </Field>

          <Field className="min-w-80 flex-1">
            <FieldLabel>Search preferences</FieldLabel>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="group-nested-5">Radius</FieldLabel>
                <Input id="group-nested-5" placeholder="50 miles" />
              </Field>
              <Field>
                <FieldLabel htmlFor="group-nested-6">Sort by</FieldLabel>
                <Input id="group-nested-6" placeholder="Best match" />
              </Field>
            </FieldGroup>
          </Field>
        </FieldGroup>
      </section>
    </div>
  ),
}
