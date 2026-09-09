import type { Meta, StoryObj } from "@storybook/react"

import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/input-group"
import { IconLocation, IconSearch } from "@/icons"

/**
 * InputGroup — a compound input wrapper that supports leading/trailing addons,
 * buttons, and text decorations around an input or textarea.
 */
const meta = {
  title: "Form/InputGroup",
  component: InputGroup,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A grouped input system with addon slots for icons, text, and buttons. " +
          "Supports inline-start/end and block-start/end positioning.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof InputGroup>

export default meta
type Story = StoryObj<typeof meta>

/** Default input group with a leading icon addon. */
export const Default: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>
          <IconLocation className="size-4" />
        </InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="Location" />
    </InputGroup>
  ),
}

/** Input group with trailing text addon. */
export const WithTrailingText: Story = {
  render: () => (
    <InputGroup>
      <InputGroupInput placeholder="0.00" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>USD</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
}

/** Input group with leading and trailing addons. */
export const WithBothAddons: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="example.com" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>.com</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
}

/** Input group with a button addon. */
export const WithButton: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>
          <IconSearch className="size-4" />
        </InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="Search..." />
      <InputGroupAddon align="inline-end">
        <InputGroupButton aria-label="Search" size="icon-xs"><IconSearch/></InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
}

/** Disabled input group. */
export const Disabled: Story = {
  render: () => (
    <InputGroup data-disabled="true">
      <InputGroupAddon>
        <InputGroupText>
          <IconLocation className="size-4" />
        </InputGroupText>
      </InputGroupAddon>
      <InputGroupInput disabled placeholder="Disabled input" />
    </InputGroup>
  ),
}

/** Input group with textarea instead of input. */
export const WithTextarea: Story = {
  render: () => (
    <InputGroup>
      <InputGroupTextarea
        id="block-end-textarea"
        placeholder="Write a comment..."
      />
        <InputGroupAddon align="block-end">
          <InputGroupButton size="sm" className="ml-auto">
              Post
          </InputGroupButton>
        </InputGroupAddon>
    </InputGroup>
  ),
}

/** Input group composed inside a Field with error. */
export const WithFieldError: Story = {
  render: () => (
    <Field data-invalid="true">
      <FieldLabel htmlFor="ig-error">Website</FieldLabel>
      <FieldContent>
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id="ig-error"
            aria-invalid="true"
            defaultValue="not a url"
          />
        </InputGroup>
        <FieldError>Please enter a valid URL.</FieldError>
      </FieldContent>
    </Field>
  ),
}
