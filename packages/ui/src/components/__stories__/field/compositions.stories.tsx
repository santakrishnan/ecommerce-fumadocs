import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "@/components/button"
import { Checkbox } from "@/components/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/field"
import { Input } from "@/components/input"
import { RadioGroup, RadioGroupItem } from "@/components/radio-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select"
import { Textarea } from "@/components/textarea"

const months = [
  { label: "MM", value: null },
  { label: "01", value: "01" },
  { label: "02", value: "02" },
  { label: "03", value: "03" },
  { label: "04", value: "04" },
  { label: "05", value: "05" },
  { label: "06", value: "06" },
  { label: "07", value: "07" },
  { label: "08", value: "08" },
  { label: "09", value: "09" },
  { label: "10", value: "10" },
  { label: "11", value: "11" },
  { label: "12", value: "12" },
]

const years = [
  { label: "YYYY", value: null },
  { label: "2024", value: "2024" },
  { label: "2025", value: "2025" },
  { label: "2026", value: "2026" },
  { label: "2027", value: "2027" },
  { label: "2028", value: "2028" },
  { label: "2029", value: "2029" },
]

/**
 * Compositions — larger, real-world form layouts built from Field primitives.
 *
 * Use these stories to QA how primitives work together in realistic scenarios.
 */
const meta = {
  title: "Form/Field/Compositions",
  component: Field,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Larger form compositions demonstrating how Field primitives combine " +
          "in real-world patterns: multi-field forms, fieldsets, radio groups, and payment flows.\n\n" +
          "[shadcn docs](https://ui.shadcn.com/docs/components/base/field) · " +
          "[Base UI docs](https://base-ui.com/react/components/field)",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

/** Contact form — FieldSet with legend and multiple fields. */
export const ContactForm: Story = {
  render: () => (
    <FieldSet>
      <FieldLegend>Contact Information</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="comp-name">Name</FieldLabel>
          <Input id="comp-name" placeholder="Jane Doe" />
        </Field>
        <Field>
          <FieldLabel htmlFor="comp-email">Email</FieldLabel>
          <FieldContent>
            <Input id="comp-email" type="email" placeholder="you@example.com" />
            <FieldDescription>We'll never share your email.</FieldDescription>
          </FieldContent>
        </Field>
        <Field>
          <FieldLabel htmlFor="comp-phone">Phone</FieldLabel>
          <Input id="comp-phone" type="tel" placeholder="(555) 123-4567" />
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
}

/** Radio group — FieldSet with radio options for single-select. */
export const RadioGroupForm: Story = {
  name: "Radio Group",
  render: () => (
    <FieldSet>
      <FieldLegend>Preferred contact method</FieldLegend>
      <RadioGroup defaultValue="email">
        <Field orientation="horizontal">
          <RadioGroupItem value="email" id="comp-radio-email" />
          <FieldLabel htmlFor="comp-radio-email">Email</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem value="phone" id="comp-radio-phone" />
          <FieldLabel htmlFor="comp-radio-phone">Phone</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem value="mail" id="comp-radio-mail" />
          <FieldLabel htmlFor="comp-radio-mail">Mail</FieldLabel>
        </Field>
      </RadioGroup>
    </FieldSet>
  ),
}

/** Responsive multi-field — demonstrates layout switching at different container widths. */
export const ResponsiveForm: Story = {
  name: "Responsive Layout",
  render: () => (
    <FieldGroup>
      <Field orientation="responsive">
        <FieldLabel htmlFor="comp-resp-name">Name</FieldLabel>
        <FieldContent>
          <Input id="comp-resp-name" placeholder="Jane Doe" />
          <FieldDescription>
            Resize the viewport to see the layout switch.
          </FieldDescription>
        </FieldContent>
      </Field>
      <Field orientation="responsive">
        <FieldLabel htmlFor="comp-resp-email">Email</FieldLabel>
        <FieldContent>
          <Input
            id="comp-resp-email"
            type="email"
            placeholder="you@example.com"
          />
          <FieldDescription>
            At wider sizes, the label moves beside the input.
          </FieldDescription>
        </FieldContent>
      </Field>
    </FieldGroup>
  ),
}

/** Validation state — fields with description and error together. */
export const ValidationStates: Story = {
  render: () => (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="comp-valid">Username (valid)</FieldLabel>
        <FieldContent>
          <Input id="comp-valid" defaultValue="johndoe" />
          <FieldDescription>This is your public display name.</FieldDescription>
        </FieldContent>
      </Field>
      <Field data-invalid="true">
        <FieldLabel htmlFor="comp-invalid">Password (invalid)</FieldLabel>
        <FieldContent>
          <Input id="comp-invalid" type="password" aria-invalid="true" />
          <FieldDescription>Must be at least 8 characters.</FieldDescription>
          <FieldError>Password is too short.</FieldError>
        </FieldContent>
      </Field>
    </FieldGroup>
  ),
}

/** Payment form — full checkout flow with selects, checkbox, textarea, and action buttons. */
export const PaymentForm: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <form>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Payment Method</FieldLegend>
            <FieldDescription>
              All transactions are secure and encrypted
            </FieldDescription>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="comp-card-name">Name on Card</FieldLabel>
                <Input
                  id="comp-card-name"
                  placeholder="Evil Rabbit"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="comp-card-number">Card Number</FieldLabel>
                <FieldContent>
                  <Input
                    id="comp-card-number"
                    placeholder="1234 5678 9012 3456"
                    required
                  />
                  <FieldDescription>
                    Enter your 16-digit card number
                  </FieldDescription>
                </FieldContent>
              </Field>
              <div className="grid grid-cols-3 gap-4">
                <Field>
                  <FieldLabel htmlFor="comp-exp-month">Month</FieldLabel>
                  <Select items={months}>
                    <SelectTrigger id="comp-exp-month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {months.map((item) => (
                          <SelectItem
                            key={item.label}
                            value={item.value ?? "month-placeholder"}
                          >
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="comp-exp-year">Year</FieldLabel>
                  <Select items={years}>
                    <SelectTrigger id="comp-exp-year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {years.map((item) => (
                          <SelectItem
                            key={item.label}
                            value={item.value ?? "year-placeholder"}
                          >
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="comp-cvv">CVV</FieldLabel>
                  <Input id="comp-cvv" placeholder="123" required />
                </Field>
              </div>
            </FieldGroup>
          </FieldSet>
          <FieldSeparator />
          <FieldSet>
            <FieldLegend>Billing Address</FieldLegend>
            <FieldDescription>
              The billing address associated with your payment method
            </FieldDescription>
            <FieldGroup>
              <Field orientation="horizontal">
                <Checkbox id="comp-same-as-shipping" defaultChecked />
                <FieldLabel
                  htmlFor="comp-same-as-shipping"
                  className="font-normal"
                >
                  Same as shipping address
                </FieldLabel>
              </Field>
            </FieldGroup>
          </FieldSet>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="comp-comments">Comments</FieldLabel>
                <Textarea
                  id="comp-comments"
                  placeholder="Add any additional comments"
                  className="resize-none"
                />
              </Field>
            </FieldGroup>
          </FieldSet>
          <Field orientation="horizontal">
            <Button type="submit">Submit</Button>
            <Button variant="tertiary" type="button">
              Cancel
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  ),
}
