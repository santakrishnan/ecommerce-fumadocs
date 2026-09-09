import type { ComponentType, SVGProps } from "react"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import type { Surface } from "@/lib/types"

type IconElement = ComponentType<SVGProps<SVGSVGElement> & { "data-icon"?: string }>

const buttonVariants = cva(
  [
    // Base layout and structure
    "group/button inline-flex shrink-0 items-center justify-center rounded-full",
    "border border-transparent bg-clip-padding",
    // Typography
    "button-text whitespace-nowrap",
    // Transitions and motion
    "transition-colors duration-200 motion-reduce:transition-none",
    // Interaction states
    "outline-none select-none",
    "active:not-aria-[haspopup]:translate-y-px",
    "disabled:pointer-events-none aria-disabled:pointer-events-none",
    // Focus ring
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    // Validation states
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
    // Icon sizing
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-(--btn-primary-bg) text-(--btn-primary-text)",
          "hover:bg-(--btn-primary-bg-hover) hover:text-(--btn-primary-text-hover)",
          "disabled:bg-(--btn-primary-disabled-bg) disabled:text-(--btn-primary-disabled-text)",
        ].join(" "),
        secondary: [
          "bg-(--btn-secondary-bg) text-(--btn-secondary-text)",
          "hover:bg-(--btn-secondary-bg-hover) hover:text-(--btn-secondary-text-hover)",
          "disabled:bg-(--btn-secondary-disabled-bg) disabled:text-(--btn-secondary-disabled-text)",
        ].join(" "),
        tertiary: [
          "border-(--btn-tertiary-border) bg-transparent text-(--btn-tertiary-text)",
          "hover:bg-transparent hover:border-(--btn-tertiary-border-hover) hover:text-(--btn-tertiary-text-hover)",
          "disabled:bg-transparent disabled:text-(--btn-tertiary-disabled-text) disabled:border-(--btn-tertiary-disabled-border)",
        ].join(" "),
        text: [
          "text-(--btn-text-text) underline-offset-4",
          "hover:text-(--btn-text-text-hover) hover:no-underline",
          "disabled:text-(--btn-text-disabled-text) disabled:no-underline",
          "aria-disabled:text-(--btn-text-disabled-text) aria-disabled:no-underline",
        ].join(" "),
      },
      size: {
        sm: "min-h-11 gap-1 px-6 py-3 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        lg: "min-h-11 gap-2 px-6 py-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-14 min-h-0 [&_svg:not([class*='size-'])]:size-5",
        "icon-sm": "size-10 min-h-0 in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-16 min-h-0 [&_svg:not([class*='size-'])]:size-6",
      },
    },
    compoundVariants: [
      { variant: "text", className: "px-0 py-0 min-h-0 min-w-11 link-text" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "sm",
    },
  }
)

function resolveIcon(icon: IconElement, position: "inline-start" | "inline-end") {
  const Icon = icon
  return <Icon data-icon={position} />
}

/**
 * Props for the `Button` component.
 *
 * Extends {@link ButtonPrimitive.Props} from `@base-ui/react/button` and
 * CVA {@link VariantProps} derived from `buttonVariants`.
 *
 * @example
 * ```tsx
 * <Button variant="secondary" size="lg" leadingIcon={PlusIcon}>
 *   Add vehicle
 * </Button>
 * ```
 */
interface ButtonProps extends ButtonPrimitive.Props, VariantProps<typeof buttonVariants> {
  /** Stretches the button to fill the width of its container. */
  fullWidth?: boolean
  /**
   * When `true` (default), renders a native `<button>` element.
   * Set to `false` to render a `<div role="button">` — useful inside
   * interactive containers where nesting `<button>` is invalid HTML.
   */
  nativeButton?: boolean
  /** Icon rendered to the left of the label. Accepts any SVG component. */
  leadingIcon?: IconElement
  /** Icon rendered to the right of the label. Accepts any SVG component. */
  trailingIcon?: IconElement
  /**
   * Surface context passed as a `data-surface` attribute.
   * Used by theme tokens to adjust button colors against different backgrounds
   * (e.g. `"dark"`, `"image"`).
   */
  surface?: Surface
}

function Button({
  className,
  variant = "primary",
  size = "sm",
  surface,
  fullWidth,
  nativeButton = true,
  leadingIcon,
  trailingIcon,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      {...(surface !== undefined ? { "data-surface": surface } : {})}
      nativeButton={nativeButton}
      className={cn(buttonVariants({ variant, size }), className, fullWidth && "w-full")}
      {...props}
    >
      {leadingIcon && resolveIcon(leadingIcon, "inline-start")}
      {children}
      {trailingIcon && resolveIcon(trailingIcon, "inline-end")}
    </ButtonPrimitive>
  )
}

export { Button }
export type { ButtonProps, IconElement }
