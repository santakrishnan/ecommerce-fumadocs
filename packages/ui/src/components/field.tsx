"use client"

import { useMemo } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Label } from "@/components/label"
import { Separator } from "@/components/separator"

interface FieldSetProps extends React.ComponentProps<"fieldset"> {}

function FieldSet({ className, ...props }: FieldSetProps) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        // Layout
        "flex flex-col gap-6",

        // Gap override for choice-control groups
        "has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",

        className
      )}
      {...props}
    />
  )
}

interface FieldLegendProps extends React.ComponentProps<"legend"> {
  variant?: "legend" | "label"
}

function FieldLegend({
  className,
  variant = "legend",
  ...props
}: FieldLegendProps) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        // Layout and typography
        "mb-3 font-semibold text-text-primary",

        // Variant sizing
        "data-[variant=label]:text-sm data-[variant=legend]:text-base",

        className
      )}
      {...props}
    />
  )
}

const fieldGroupVariants = cva(
  [
    "group/field-group @container/field-group flex w-full",

    // Gap overrides for choice-control groups and nested groups.
    "data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4",
  ].join(" "),
  {
    variants: {
      orientation: {
        vertical: "flex-col gap-6",
        horizontal: "flex-row flex-wrap gap-2",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

interface FieldGroupProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof fieldGroupVariants> {}

function FieldGroup({
  className,
  orientation = "vertical",
  ...props
}: FieldGroupProps) {
  return (
    <div
      data-slot="field-group"
      data-orientation={orientation}
      className={cn(
        fieldGroupVariants({ orientation }),

        className
      )}
      {...props}
    />
  )
}

const fieldVariants = cva(
  "group/field @container/field flex w-full gap-3 has-[>[role=checkbox],[role=radio]]:gap-2 data-[invalid=true]:text-destructive",
  {
    variants: {
      orientation: {
        vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
        horizontal:
          "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive:
          "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

interface FieldProps extends React.ComponentProps<"div">, VariantProps<typeof fieldVariants> {}

function Field({
  className,
  orientation = "vertical",
  ...props
}: FieldProps) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(
        fieldVariants({ orientation }),
        "transition-colors has-[>[data-slot=floating-label]]:relative",
        className
      )}
      {...props}
    />
  )
}

interface FieldContentProps extends React.ComponentProps<"div"> {}

function FieldContent({ className, ...props }: FieldContentProps) {
  return (
    <div
      data-slot="field-content"
      className={cn(
        // Layout and typography
        "group/field-content flex flex-1 flex-col gap-1.5 leading-snug",

        // Disabled state
        "group-data-[disabled=true]/field:pointer-events-none",

        className
      )}
      {...props}
    />
  )
}

const fieldLabelVariants = cva(
  [
    // Layout and base
    "group/field-label peer/field-label flex w-fit gap-2 leading-snug",

    // Transitions
    "transition-[color,opacity]",

    // Disabled state
    "group-data-[disabled=true]/field:pointer-events-none group-data-[disabled=true]/field:text-text-inactive",

    // Invalid state
    "group-data-[invalid=true]/field:text-destructive",

    // Checked card state
    // "has-data-checked:border-primary/30 has-data-checked:bg-primary/5",
    // Dark mode checked card state
    // "dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10",

    // Choice-card container (wrapping a nested Field)
    "has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border has-[>[data-slot=field]]:border-transparent has-[>[data-slot=field]]:bg-neutral-50",
    "has-[>[data-slot=field]]:transition-colors has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:p-5",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "font-semibold",
        sublabel: "text-xs font-normal",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface FieldLabelProps
  extends React.ComponentProps<typeof Label>,
    VariantProps<typeof fieldLabelVariants> {}

function FieldLabel({
  className,
  variant = "default",
  ...props
}: FieldLabelProps) {
  return (
    <Label
      data-slot="field-label"
      className={cn(fieldLabelVariants({ variant }), className)}
      {...props}
    />
  )
}

interface FieldTitleProps extends React.ComponentProps<"div"> {}

function FieldTitle({ className, ...props }: FieldTitleProps) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        // Layout and typography
        "flex w-fit items-center gap-2 subhead-lg text-text-primary",

        // Disabled state
        "group-data-[disabled=true]/field:text-text-inactive",

        // Choice card
        "in-data-[slot=field-label]:text-text-primary-light",
        "in-data-[slot=field-label]:group-data-[disabled=true]/field:text-text-inactive-light",
        "group-data-[invalid=true]/field:text-destructive",

        className
      )}
      {...props}
    />
  )
}

interface FieldDescriptionProps extends React.ComponentProps<"p"> {}

function FieldDescription({ className, ...props }: FieldDescriptionProps) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        // Typography and layout
        "text-left body-sm text-text-tertiary",

        // Context-aware adjustments
        "group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-1.5",

        // Sibling spacing
        "last:mt-0 nth-last-2:-mt-1",

        // Link styling
        "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-text-primary",

        // Choice card
        "in-data-[slot=field-label]:text-text-tertiary-light",
        "in-data-[slot=field-label]:group-data-[disabled=true]/field:text-text-inactive-light",
        "in-data-[slot=field-label]:group-data-[invalid=true]/field:text-destructive",


        className
      )}
      {...props}
    />
  )
}

interface FieldSeparatorProps extends React.ComponentProps<"div"> {
  children?: React.ReactNode
}

function FieldSeparator({
  children,
  className,
  ...props
}: FieldSeparatorProps) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        // Layout
        "relative -my-2 h-5 text-sm",

        // Outline variant adjustment
        "group-data-[variant=outline]/field-group:-mb-2",

        className
      )}
      {...props}
    >
      <Separator className="absolute inset-x-0 top-1/2" />
      {children && (
        <span
          className="relative mx-auto block w-fit bg-background px-2 text-text-secondary"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  )
}

interface FieldErrorProps extends React.ComponentProps<"div"> {
  errors?: Array<{ message?: string } | undefined>
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: FieldErrorProps) {
  const content = useMemo(() => {
    if (children) {
      return children
    }

    if (!errors?.length) {
      return null
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ]

    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>
        )}
      </ul>
    )
  }, [children, errors])

  if (!content) {
    return null
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-sm font-normal text-destructive", className)}
      {...props}
    >
      {content}
    </div>
  )
}

interface FloatingLabelProps extends Omit<FieldLabelProps, "variant"> {}

/**
 * Floating label for text field composition.
 *
 * Animates between resting (centered, full-size) and floating (top, scaled-down)
 * positions using pure CSS peer selectors. No JavaScript state is involved.
 *
 * @remarks
 * - Must be rendered immediately after `FloatingInput` in DOM order
 * - Parent `Field` must have `className="relative"` for absolute positioning
 * - `htmlFor` is required for accessibility — must match `FloatingInput`'s `id`
 *
 * @example
 * ```tsx
 * <Field className="relative">
 *   <FloatingInput id="name" />
 *   <FloatingLabel htmlFor="name">Full Name</FloatingLabel>
 * </Field>
 * ```
 */
function FloatingLabel({
  className,
  children,
  ...props
}: FloatingLabelProps) {
  return (
    <Label
      data-slot="floating-label"
      className={cn(
        // positioning — centered vertically in the input/trigger at rest
        "absolute left-5 pr-10 top-9 -translate-y-1/2",

        // resting state typography: 14px, weight 400, secondary color
        "text-sm font-normal text-text-secondary-light",

        // animation
        "transition-all duration-200 ease-out",
        "pointer-events-none select-none origin-left",

        // lifted: input focused — shrinks to 12px, centered group with 4px gap above value
        "peer-focus:top-4 peer-focus:translate-y-0 peer-focus:text-xs",

        // lifted: input has a value (placeholder no longer shown)
        "peer-[:not(:placeholder-shown)]:top-4",
        "peer-[:not(:placeholder-shown)]:translate-y-0",
        "peer-[:not(:placeholder-shown)]:text-xs",

        // extra right padding for truncation when paired with Select (clears the chevron icon)
        // data-value is always present on the Select wrapper, so this always fires for select
        "peer-data-value/select:pr-15",


        // lifted: select is open or has a value (data-floating attribute present)
        "peer-data-floating/select:top-4",
        "peer-data-floating/select:translate-y-0",
        "peer-data-floating/select:text-xs",

        // error state — from parent Field
        "group-data-[invalid=true]/field:text-destructive",
        "group-data-[invalid=true]/field:peer-focus:text-destructive",

        // disabled state
        "peer-disabled:text-text-inactive-light",
        "peer-data-disabled/select:text-text-inactive-light",

        className
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
    </Label>
  )
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FloatingLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
}

export type {
  FieldProps,
  FieldLabelProps,
  FieldDescriptionProps,
  FieldErrorProps,
  FieldGroupProps,
  FloatingLabelProps,
  FieldLegendProps,
  FieldSeparatorProps,
  FieldSetProps,
  FieldContentProps,
  FieldTitleProps,
}
