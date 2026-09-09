"use client"

import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"

import { cn } from "@/lib/utils"
import type { Surface } from "@/lib/types"
import { IconCheckCircle } from "@/icons"

function RadioGroup({
  className,
  surface,
  ...props
}: RadioGroupPrimitive.Props & {
  surface?: Surface
}) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      {...(surface !== undefined ? { "data-surface": surface } : {})}
      className={cn("grid w-full gap-3", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  surface,
  ...props
}: RadioPrimitive.Root.Props & {
    surface?: Surface
  }) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      {...(surface !== undefined ? { "data-surface": surface } : {})}
      className={cn(
        // Layout and shape
        "group/radio-group-item peer relative flex aspect-square size-6 shrink-0 items-center justify-center rounded-full bg-transparent outline-none",

        // Touch target
        "after:absolute after:-inset-x-3 after:-inset-y-2",

        // Unchecked state
        "data-unchecked:border data-unchecked:border-text-primary",

        // Checked state
        "data-checked:text-text-primary",

        // Disabled state
        "data-disabled:pointer-events-none data-disabled:cursor-not-allowed",
        "data-disabled:data-unchecked:border-text-inactive data-disabled:data-checked:text-text-inactive",

        // Focus state
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2",

        // Invalid state
        "aria-invalid:border aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:data-unchecked:border-destructive",

        // Choice-card override: pin to light-mode when inside FieldLabel
        // NOTE: Using [[data-slot=field-label]_&] syntax intentionally — the shorthand
        // in-data-[slot=field-label] does not produce equivalent CSS output.
        "[[data-slot=field-label]_&]:self-start",
        "[[data-slot=field-label]_&]:data-unchecked:border-text-primary-light",
        "[[data-slot=field-label]_&]:data-checked:text-text-primary-light",
        "[[data-slot=field-label]_&]:data-disabled:data-unchecked:border-text-inactive-light",
        "[[data-slot=field-label]_&]:data-disabled:data-checked:text-text-inactive-light",
        "[[data-slot=field-label]_&]:aria-invalid:data-unchecked:border-destructive",

        className
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-6 items-center justify-center"
      >
        <IconCheckCircle
          className={cn(
            // Icon sizing
            "size-6",
            // Dark surface: inner checkmark becomes black
            "surface-dark:[--icon-check-circle-inner:var(--color-text-primary-light)]",

            // Choice-card override: inner checkmark stays dark
            // NOTE: Using [[data-slot=field-label]_&] syntax intentionally — the shorthand
            // in-data-[slot=field-label] does not produce equivalent CSS output.
            "[[data-slot=field-label]_&]:[--icon-check-circle-inner:var(--color-text-primary-dark)]",
          )}
        />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  )
}

export { RadioGroup, RadioGroupItem }
