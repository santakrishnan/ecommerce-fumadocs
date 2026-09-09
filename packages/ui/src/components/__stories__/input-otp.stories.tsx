import type { Meta, StoryObj } from "@storybook/react"
import { REGEXP_ONLY_DIGITS } from "input-otp"

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/input-otp"

/**
 * InputOTP — a one-time password input built on input-otp.
 *
 * Provides accessible OTP entry with keyboard navigation, paste support,
 * and screen reader announcements. Cells use max-w-14.25 with flex-1 so
 * they cap at 57px but shrink responsively. Border is transparent by default
 * and visible against the Storybook background switcher (bg-surface-secondary).
 */
const meta: Meta = {
  title: "Components/InputOTP",
  component: InputOTP,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A one-time password input built on [input-otp](https://github.com/guilhermerodz/input-otp). " +
          "Original shadcn implementation: [shadcn/ui InputOTP (Base)](https://ui.shadcn.com/docs/components/base/input-otp).",
      },
    },
    a11y: {
      config: {
        rules: [
          {
            // The hidden input rendered by input-otp uses inline opacity:0
            // and is not meant to be visually readable — skip contrast check.
            id: "color-contrast",
            selector: 'input[data-input-otp="true"]',
            enabled: false,
          },
        ],
      },
    },
  },
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof meta>

// --- Default (single group of 6) ---

/** Default 6-digit OTP — all cells in a single group matching the Figma Handoff layout. */
export const Default: Story = {
  render: () => (
    <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} aria-label="One-time password">
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  ),
}

// --- Filled ---

/** All 6 cells filled with digits — demonstrates the filled state. */
export const Filled: Story = {
  render: () => (
    <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} defaultValue="123456" aria-label="One-time password">
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  ),
}

// --- With Resend Link ---

/**
 * Full composition with "Didn't get a code? Resend" below the OTP input.
 * Demonstrates consumer-composed layout from the Handoff design.
 */
export const WithResendLink: Story = {
  render: () => (
    <div className="flex w-fit flex-col items-center gap-8">
      <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} aria-label="Verification code">
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <p className="text-xs font-semibold leading-heading tracking-tightest">
        <span className="text-text-subtle">Didn't get a code?</span>
        {" "}
        <button className="font-semibold text-text-primary" type="button">Resend</button>
      </p>
    </div>
  ),
}

// --- Four Digit PIN ---

/** 4-slot variant for PIN codes. */
export const FourDigitPin: Story = {
  render: () => (
    <InputOTP maxLength={4} pattern={REGEXP_ONLY_DIGITS} aria-label="PIN code">
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTPGroup>
    </InputOTP>
  ),
}

// --- Disabled ---

/** Disabled state — input is not interactive. */
export const Disabled: Story = {
  render: () => (
    <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} disabled aria-label="One-time password">
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  ),
}
