import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Layout and sizing
        "flex field-sizing-content min-h-16 w-full rounded-lg px-2.5 py-2",
        // Surface and border
        "border border-input bg-neutral-50 shadow-none outline-none",
        // Typography
        "body-lg md:body-md text-text-primary-light",
        // Placeholder text
        "placeholder:text-text-secondary-light",
        // Visual transitions
        "transition-[color,box-shadow]",
        // Focus styles
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        // Disabled styles
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-inactive",
        "disabled:text-text-inactive-light disabled:placeholder:text-text-inactive-light",
        // Invalid state
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        // Dark mode overrides
        "dark:bg-input/30 dark:aria-invalid:border-destructive/50",
        "dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

const floatingTextareaVariants = cva(
  [
    "peer",
    "min-h-18 rounded-xl resize-none",
    "pt-8.5 pb-4 px-5",
    // Typography
    "body-md",
    "placeholder:body-md",
  ],
  {
    variants: {
      variant: {
        default: "border-neutral-50 disabled:border-surface-inactive",
        outlined: [
          "border-surface-secondary bg-surface-primary",
          "disabled:border-surface-secondary",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface FloatingTextareaProps
  extends React.ComponentProps<"textarea">,
    VariantProps<typeof floatingTextareaVariants> {}

/**
 * A floating-label-ready textarea that extends the base Textarea with peer detection.
 *
 * @remarks
 * Must be rendered immediately before `FloatingLabel` as a sibling within a
 * relative-positioned `Field` container for peer selector styling to function.
 *
 * The `placeholder` prop defaults to a single space (`" "`) when not provided,
 * which activates the `:placeholder-shown` CSS pseudo-class for empty-state detection.
 * When an explicit placeholder is provided, it is hidden at rest and fades in on focus.
 *
 * Uses `field-sizing-content` to auto-grow with content — no fixed height is imposed.
 *
 * @example
 * ```tsx
 * <Field className="relative">
 *   <FloatingTextarea id="notes" />
 *   <FloatingLabel htmlFor="notes">Add note</FloatingLabel>
 * </Field>
 * ```
 */
function FloatingTextarea({
  className,
  placeholder,
  variant,
  ...props
}: FloatingTextareaProps) {
  return (
    <Textarea
      placeholder={placeholder ?? " "}
      className={cn(
        floatingTextareaVariants({ variant }),
        placeholder
          ? ["placeholder:opacity-0", "focus:placeholder:opacity-100"]
          : "placeholder:text-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Textarea, FloatingTextarea }
