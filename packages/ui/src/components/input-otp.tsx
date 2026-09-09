"use client"

import * as React from "react"
import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS, REGEXP_ONLY_CHARS, REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputOTPGroupVariants = cva("flex items-center", {
  variants: {
    size: {
      default: "gap-1",
      // Future variants:
      // sm: "gap-2",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

const inputOTPSlotVariants = cva(
  "relative flex items-center justify-center transition-all data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-3 data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/20 dark:bg-input/30 dark:data-[active=true]:aria-invalid:ring-destructive/40",
  {
    variants: {
      size: {
        default:
          "h-18 w-14.25 rounded-xl border border-transparent bg-surface-primary text-2xl font-normal leading-body tracking-tighter text-neutral-800 shadow-none",
        // Future variants:
        // sm: "h-9 w-9 rounded-md border border-input text-sm shadow-xs",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      pushPasswordManagerStrategy="none"
      containerClassName={cn("flex items-center has-disabled:opacity-50", containerClassName)}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
}

function InputOTPGroup({
  className,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputOTPGroupVariants>) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn(inputOTPGroupVariants({ size }), className)}
      {...props}
    />
  )
}

function InputOTPCaret() {
  return (
    <div
      data-slot="input-otp-caret"
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      <div className="h-6 w-0.5 animate-caret-blink bg-text-primary" />
    </div>
  )
}

function InputOTPSlot({
  index,
  className,
  size,
  ...props
}: React.ComponentProps<"div"> & { index: number } & VariantProps<typeof inputOTPSlotVariants>) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, isActive } = inputOTPContext.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      data-filled={!!char}
      className={cn(inputOTPSlotVariants({ size }), "min-w-0 overflow-hidden", className)}
      {...props}
    >
      {char && <span>{char}</span>}
      {isActive && !char && <InputOTPCaret />}
    </div>
  )
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="input-otp-separator" role="separator" {...props} />
  )
}

export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
  REGEXP_ONLY_DIGITS,
  REGEXP_ONLY_CHARS,
  REGEXP_ONLY_DIGITS_AND_CHARS,
}
