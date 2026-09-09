import * as React from "react"
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
  FieldTitle,
  FloatingLabel,
} from "@/components/field"
import { RadioGroup, RadioGroupItem } from "@/components/radio-group"
import {
  FloatingSelectTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/select"
import { Switch } from "@/components/switch"

/**
 * FieldChoiceCard — Using Field with horizontal orientation to create choice cards.
 *
 * This pattern wraps form inputs (radio, checkbox, switch) with rich descriptions
 * and titles using the Field compound component system. The horizontal orientation
 * creates a visually prominent card-like appearance for each option.
 *
 * ### Pattern Components
 * - `FieldSet` + `FieldLegend` — group title
 * - `FieldDescription` — group description
 * - `Field orientation="horizontal"` — individual choice card
 * - `FieldContent` + `FieldTitle` + `FieldDescription` — card content
 * - Input control (RadioGroupItem, Checkbox, Switch) — card interaction
 *
 * ### Use Cases
 * - **Radio**: Mutually exclusive options (plans, environments, methods)
 * - **Checkbox**: Multi-select options (features, add-ons, preferences)
 * - **Switch**: Toggle features per card (settings, feature flags)
 */
const meta = {
  title: "Form/FieldChoiceCard",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Choice cards using Field compound components with horizontal orientation. " +
          "Reference: [shadcn/ui Field Choice Card (Base)](https://ui.shadcn.com/docs/components/base/field#choice-card).",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

/** Field choice card with radio — single select. */
export const FieldChoiceRadio: Story = {
  render: () => (
    <FieldGroup className="w-full max-w-2xl">
      <FieldSet>
        <FieldLegend variant="label">Shipping Method</FieldLegend>
        <FieldDescription>
          Choose how you'd like to receive your order.
        </FieldDescription>
        <RadioGroup defaultValue="express">
          <FieldLabel htmlFor="shipping-standard">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Standard Shipping</FieldTitle>
                <FieldDescription>
                  5-7 business days. Free shipping.
                </FieldDescription>
              </FieldContent>
              <RadioGroupItem value="standard" id="shipping-standard" />
            </Field>
          </FieldLabel>
          <FieldLabel htmlFor="shipping-express">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Express Shipping</FieldTitle>
                <FieldDescription>
                  2-3 business days. $10.00
                </FieldDescription>
              </FieldContent>
              <RadioGroupItem value="express" id="shipping-express" />
            </Field>
          </FieldLabel>
          <FieldLabel htmlFor="shipping-overnight">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Overnight Shipping</FieldTitle>
                <FieldDescription>
                  Next business day. $25.00
                </FieldDescription>
              </FieldContent>
              <RadioGroupItem value="overnight" id="shipping-overnight" />
            </Field>
          </FieldLabel>
        </RadioGroup>
      </FieldSet>
    </FieldGroup>
  ),
}

/** Field choice card with checkbox — multi-select. */
export const FieldChoiceCheckbox: Story = {
  render: () => {
    const [features, setFeatures] = React.useState<Record<string, boolean>>({
      analytics: true,
      support: false,
      api: false,
    })

    const toggleFeature = (feature: string) => {
      setFeatures((prev) => ({ ...prev, [feature]: !prev[feature] }))
    }

    return (
      <FieldGroup className="w-full max-w-2xl">
        <FieldSet>
          <FieldLegend variant="label">Add-on Features</FieldLegend>
          <FieldDescription>
            Choose additional features to enhance your account.
          </FieldDescription>
          <FieldLabel htmlFor="analytics-cb">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Advanced Analytics</FieldTitle>
                <FieldDescription>
                  Real-time insights and comprehensive reporting. $15/mo
                </FieldDescription>
              </FieldContent>
              <Checkbox
                id="analytics-cb"
                checked={features.analytics}
                onCheckedChange={() => toggleFeature("analytics")}
              />
            </Field>
          </FieldLabel>
          <FieldLabel htmlFor="support-cb">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Priority Support</FieldTitle>
                <FieldDescription>
                  24/7 dedicated support team. $20/mo
                </FieldDescription>
              </FieldContent>
              <Checkbox
                id="support-cb"
                checked={features.support}
                onCheckedChange={() => toggleFeature("support")}
              />
            </Field>
          </FieldLabel>
          <FieldLabel htmlFor="api-cb">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>API Access</FieldTitle>
                <FieldDescription>
                  Full API documentation and webhooks. $10/mo
                </FieldDescription>
              </FieldContent>
              <Checkbox
                id="api-cb"
                checked={features.api}
                onCheckedChange={() => toggleFeature("api")}
              />
            </Field>
          </FieldLabel>
        </FieldSet>
      </FieldGroup>
    )
  },
}

/** Field choice card with switch — independent toggles. */
export const FieldChoiceSwitch: Story = {
  render: () => {
    const [settings, setSettings] = React.useState<Record<string, boolean>>({
      notifications: true,
      autoSave: false,
    })

    const toggleSetting = (key: string) => {
      setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
    }

    return (
      <FieldGroup className="w-full max-w-2xl">
        <FieldSet>
          <FieldLegend variant="label">Preferences</FieldLegend>
          <FieldDescription>
            Customize your account settings.
          </FieldDescription>
          <FieldLabel htmlFor="notifications-sw">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Email Notifications</FieldTitle>
                <FieldDescription>
                  Checked state.
                </FieldDescription>
              </FieldContent>
              <Switch
                id="notifications-sw"
                checked={settings.notifications}
                onCheckedChange={() => toggleSetting("notifications")}
              />
            </Field>
          </FieldLabel>
          <FieldLabel htmlFor="autosave-sw">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Auto-save Changes</FieldTitle>
                <FieldDescription>
                  Unchecked state.
                </FieldDescription>
              </FieldContent>
              <Switch
                id="autosave-sw"
                checked={settings.autoSave}
                onCheckedChange={() => toggleSetting("autoSave")}
              />
            </Field>
          </FieldLabel>
        </FieldSet>
      </FieldGroup>
    )
  },
}


/** Field choice card — disabled state. */
export const FieldChoiceDisabled: Story = {
  render: () => (
    <FieldGroup className="w-full max-w-2xl">
      <FieldSet>
        <FieldLegend variant="label">Disabled — Radio</FieldLegend>
        <FieldDescription>
          These options are currently unavailable.
        </FieldDescription>
        <RadioGroup disabled defaultValue="standard">
          <FieldLabel htmlFor="dis-standard">
            <Field orientation="horizontal" data-disabled="true">
              <FieldContent>
                <FieldTitle>Standard Shipping</FieldTitle>
                <FieldDescription>
                  5-7 business days. Free shipping.
                </FieldDescription>
              </FieldContent>
              <RadioGroupItem value="standard" id="dis-standard" />
            </Field>
          </FieldLabel>
          <FieldLabel htmlFor="dis-express">
            <Field orientation="horizontal" data-disabled="true">
              <FieldContent>
                <FieldTitle>Express Shipping</FieldTitle>
                <FieldDescription>
                  2-3 business days. $10.00
                </FieldDescription>
              </FieldContent>
              <RadioGroupItem value="express" id="dis-express" />
            </Field>
          </FieldLabel>
        </RadioGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Disabled — Checkbox</FieldLegend>
        <FieldDescription>
          These features cannot be modified.
        </FieldDescription>
        <FieldLabel htmlFor="dis-cb-analytics">
          <Field orientation="horizontal" data-disabled="true">
            <FieldContent>
              <FieldTitle>Advanced Analytics</FieldTitle>
              <FieldDescription>
                Real-time insights and comprehensive reporting.
              </FieldDescription>
            </FieldContent>
            <Checkbox id="dis-cb-analytics" disabled defaultChecked />
          </Field>
        </FieldLabel>
        <FieldLabel htmlFor="dis-cb-support">
          <Field orientation="horizontal" data-disabled="true">
            <FieldContent>
              <FieldTitle>Priority Support</FieldTitle>
              <FieldDescription>
                24/7 dedicated support team.
              </FieldDescription>
            </FieldContent>
            <Checkbox id="dis-cb-support" disabled />
          </Field>
        </FieldLabel>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Disabled — Switch</FieldLegend>
        <FieldDescription>
          These settings are locked by your administrator.
        </FieldDescription>
        <FieldLabel htmlFor="dis-sw-notif">
          <Field orientation="horizontal" data-disabled="true">
            <FieldContent>
              <FieldTitle>Email Notifications</FieldTitle>
              <FieldDescription>
                Disabled - Checked.
              </FieldDescription>
            </FieldContent>
            <Switch id="dis-sw-notif" disabled checked />
          </Field>
        </FieldLabel>
        <FieldLabel htmlFor="dis-sw-autosave">
          <Field orientation="horizontal" data-disabled="true">
            <FieldContent>
              <FieldTitle>Auto-save Changes</FieldTitle>
              <FieldDescription>
                Disabled - Unchecked.
              </FieldDescription>
            </FieldContent>
            <Switch id="dis-sw-autosave" disabled />
          </Field>
        </FieldLabel>
      </FieldSet>
    </FieldGroup>
  ),
}

/** Field choice card with multiple sibling Fields under one FieldLabel — demonstrates no double-padding. */
export const FieldChoiceMultiField: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<Record<string, boolean>>({
      vsa: true,
      gap: false,
    })

    const toggle = (key: string) => {
      setSelected((prev) => ({ ...prev, [key]: !prev[key] }))
    }

    return (
      <FieldGroup className="w-full max-w-md">
        <FieldSet>
          <FieldLegend variant="label">Protection Products</FieldLegend>
          <FieldLabel htmlFor="vsa-cb">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Vehicle Service Agreements</FieldTitle>
                <FieldDescription>
                  Help protect your vehicle and your peace of mind. Get coverage
                  for eligible parts and repairs.
                </FieldDescription>
              </FieldContent>
              <Checkbox
                id="vsa-cb"
                checked={selected.vsa}
                onCheckedChange={() => toggle("vsa")}
              />
            </Field>
            <Field>
              <Select>
                <FloatingSelectTrigger variant="outlined">
                  <SelectValue placeholder="Select coverage" />
                </FloatingSelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value="silver-2yr">
                    Silver - 2yr/30k mi — +$69.99/mo ($1,680 total)
                  </SelectItem>
                  <SelectItem value="platinum-3yr">
                    Platinum - 3yr/50k mi — +$119.89/mo ($3,745 total)
                  </SelectItem>
                  <SelectItem value="gold-5yr">
                    Gold - 5yr/75k mi — +$89.99/mo ($4,320 total)
                  </SelectItem>
                </SelectContent>
              </Select>
              <FloatingLabel>Length of coverage</FloatingLabel>
            </Field>
          </FieldLabel>
          <FieldLabel htmlFor="gap-cb">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>GAP Coverage</FieldTitle>
                <FieldDescription>
                  Covers the difference between what you owe and what your
                  vehicle is worth if it's totaled or stolen.
                </FieldDescription>
              </FieldContent>
              <Checkbox
                id="gap-cb"
                checked={selected.gap}
                onCheckedChange={() => toggle("gap")}
              />
            </Field>
            <Field>
              <Select>
                <FloatingSelectTrigger variant="outlined">
                  <SelectValue placeholder="Select coverage" />
                </FloatingSelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value="standard-5yr">
                    Standard - 5yr/60k mi — +$29.99/mo ($1,080 total)
                  </SelectItem>
                  <SelectItem value="extended-7yr">
                    Extended - 7yr/100k mi — +$39.99/mo ($1,680 total)
                  </SelectItem>
                </SelectContent>
              </Select>
              <FloatingLabel>Coverage term</FloatingLabel>
            </Field>
          </FieldLabel>
        </FieldSet>
      </FieldGroup>
    )
  },
}

/** Field choice card — error/invalid state. */
export const FieldChoiceError: Story = {
  render: () => (
    <FieldGroup className="w-full max-w-2xl">
      <FieldSet>
        <FieldLegend variant="label">Error — Radio</FieldLegend>
        <RadioGroup>
          <FieldLabel htmlFor="err-free">
            <Field orientation="horizontal" data-invalid="true">
              <FieldContent>
                <FieldTitle>Free</FieldTitle>
                <FieldDescription>
                  Basic features with limited usage.
                </FieldDescription>
              </FieldContent>
              <RadioGroupItem value="free" id="err-free" aria-invalid="true" />
            </Field>
          </FieldLabel>
        </RadioGroup>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Error — Checkbox</FieldLegend>
        <FieldLabel htmlFor="err-cb-terms">
          <Field orientation="horizontal" data-invalid="true">
            <FieldContent>
              <FieldTitle>Accept Terms</FieldTitle>
              <FieldDescription>
                You must accept the terms to continue.
              </FieldDescription>
            </FieldContent>
            <Checkbox id="err-cb-terms" aria-invalid="true" />
          </Field>
        </FieldLabel>
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Error — Switch</FieldLegend>
        <FieldLabel htmlFor="err-sw-notif">
          <Field orientation="horizontal" data-invalid="true">
            <FieldContent>
              <FieldTitle>Enable Notifications</FieldTitle>
              <FieldDescription>
                You must enable at least one notification channel.
              </FieldDescription>
            </FieldContent>
            <Switch id="err-sw-notif" aria-invalid="true" />
          </Field>
        </FieldLabel>
      </FieldSet>
    </FieldGroup>
  ),
}
