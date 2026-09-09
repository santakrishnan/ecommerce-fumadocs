"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        // Layout and shape
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs",

        // Transitions
        "transition-all outline-none",

        // Touch target
        "after:absolute after:-inset-x-3 after:-inset-y-2",

        // Size variants
        "data-[size=default]:h-[18.4px] data-[size=default]:w-[32px]",
        "data-[size=sm]:h-[14px] data-[size=sm]:w-[24px]",

        // Checked/unchecked state
        "data-checked:bg-primary data-unchecked:bg-input",
        "dark:data-unchecked:bg-input/80",

        // Disabled state
        "data-disabled:cursor-not-allowed data-disabled:data-checked:bg-text-inactive",

        // Focus state
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",

        // Invalid state
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",

        // Choice-card override: pin to light-mode when inside FieldLabel
        // NOTE: Using [[data-slot=field-label]_&] syntax intentionally — the shorthand
        // in-data-[slot=field-label] does not produce equivalent CSS output.
        "[[data-slot=field-label]_&]:self-start",
        "[[data-slot=field-label]_&]:data-disabled:data-checked:bg-text-inactive-light",

        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Layout and shape
          "pointer-events-none block rounded-full bg-background ring-0 transition-transform",

          // Size variants
          "group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3",

          // Checked position
          "group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)]",
          "group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)]",
          "dark:data-checked:bg-primary-foreground",

          // Unchecked position
          "group-data-[size=default]/switch:data-unchecked:translate-x-0",
          "group-data-[size=sm]/switch:data-unchecked:translate-x-0",
          "dark:data-unchecked:bg-foreground",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
