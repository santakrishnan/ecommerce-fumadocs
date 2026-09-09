import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  [
    // Base layout and structure
    "group/badge inline-flex min-h-6 w-fit border border-transparent shrink-0 items-center justify-center",
    // Spacing and shape
    "gap-1 overflow-hidden rounded-3xl px-2 py-1 disclaimer whitespace-nowrap",
    // Interaction and focus states
    "transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
    "focus-visible:ring-offset-3 has-data-[icon=inline-start]:ps-1 has-data-[icon=inline-end]:pe-1",
    // Validation states
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
    // Icon sizing/behavior
    "[&>svg]:pointer-events-none [&>svg]:size-4!",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-card-dark text-text-primary-dark",
        inverse: "bg-neutral-500 text-text-secondary-dark",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface BadgeProps
  extends useRender.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {}

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: BadgeProps) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
export type { BadgeProps }
