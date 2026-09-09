import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {}

const floatingInputVariants = cva(
  "peer h-18 pt-8.5 pb-4 px-5 rounded-xl text-sm font-normal placeholder:text-sm placeholder:font-normal",
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

export interface FloatingInputProps
  extends InputProps,
    VariantProps<typeof floatingInputVariants> {}

function Input({ className, type, ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // Layout and sizing
        "h-9 w-full min-w-0 rounded-lg px-2.5 py-1",
        // Surface and border
        "border border-input bg-neutral-50 shadow-none outline-none",
        // Typography
        "text-base text-text-primary-light md:text-sm",
        // Placeholder text
        "placeholder:text-text-secondary-light",
        // Visual transitions
        "transition-[color,box-shadow]",
        // File input reset
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent",
        // File input typography
        "file:text-sm file:font-medium file:text-foreground",
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

/**
 * A floating-label-ready input that extends the base Input with peer detection.
 *
 * @remarks
 * Must be rendered immediately before `FloatingLabel` as a sibling within a
 * relative-positioned `Field` container for peer selector styling to function.
 *
 * The `placeholder` prop defaults to a single space (`" "`) when not provided,
 * which activates the `:placeholder-shown` CSS pseudo-class for empty-state detection.
 * When an explicit placeholder is provided, it is hidden at rest and fades in on focus.
 *
 * @example
 * ```tsx
 * <Field className="relative">
 *   <FloatingInput id="email" {...field} />
 *   <FloatingLabel htmlFor="email">Email Address</FloatingLabel>
 * </Field>
 * ```
 */
function FloatingInput({
  className,
  placeholder,
  variant,
  ...props
}: FloatingInputProps) {
  return (
    <Input
      placeholder={placeholder ?? " "}
      className={cn(
        floatingInputVariants({ variant }),
        placeholder
          ? [
              "placeholder:opacity-0",
              "focus:placeholder:opacity-100",
            ]
          : "placeholder:text-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Input, FloatingInput }
