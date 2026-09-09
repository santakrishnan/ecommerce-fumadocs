"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"

import { cn } from "@/lib/utils"
import type { Surface } from "@/lib/types"
import { IconCheckmark } from "@/icons"

function Checkbox({
  className,
  surface,
  ...props }: CheckboxPrimitive.Root.Props & {
    surface?: Surface
  }) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      {...(surface !== undefined ? { "data-surface": surface } : {})}
      className={cn(
        // Layout and shape
        "peer relative flex size-5 shrink-0 items-center justify-center rounded-[4px] outline-none transition-shadow",

        // Touch target
        "after:absolute after:-inset-x-3 after:-inset-y-2",

        // Unchecked state
        "data-unchecked:border data-unchecked:border-text-primary",

        // Checked state
        "data-checked:border-transparent data-checked:bg-text-primary data-checked:text-text-primary-dark",
        "surface-dark:data-checked:text-text-primary-light",

        // Disabled state
        "data-disabled:pointer-events-none data-disabled:cursor-not-allowed disabled:cursor-not-allowed",
        "data-disabled:data-unchecked:border-text-inactive data-disabled:data-checked:bg-text-inactive",

        // Focus state
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",

        // Invalid state
        "aria-invalid:data-unchecked:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",

        // Choice-card override: pin to light-mode when inside FieldLabel
        // NOTE: Using [[data-slot=field-label]_&] syntax intentionally — the shorthand
        // in-data-[slot=field-label] does not produce equivalent CSS output.
        "[[data-slot=field-label]_&]:self-start",
        "[[data-slot=field-label]_&]:data-unchecked:border-text-primary-light",
        "[[data-slot=field-label]_&]:data-checked:bg-text-primary-light [[data-slot=field-label]_&]:data-checked:text-text-primary-dark",
        "[[data-slot=field-label]_&]:data-disabled:data-unchecked:border-text-inactive-light [[data-slot=field-label]_&]:data-disabled:data-checked:text-text-primary-dark",
        "[[data-slot=field-label]_&]:data-disabled:data-checked:bg-text-inactive-light",
        "[[data-slot=field-label]_&]:aria-invalid:data-unchecked:border-destructive",

        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={cn(
          // Layout
          "grid place-content-center text-current transition-none",

          // Icon sizing
          "[&>svg]:size-5",
        )}
      >
        <IconCheckmark />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
