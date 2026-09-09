"use client"

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 aria-pressed:[&_svg_path]:fill-current aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 ",
  {
    variants: {
      variant: {
        default:
          "bg-transparent hover:bg-transparent aria-pressed:bg-transparent text-text-primary disabled:text-text-inactive h-14 gap-[3px] rounded-full py-3 text-sm font-semibold leading-heading tracking-tightest [&_svg:not([class*='size-'])]:size-3.5",
        icon: "bg-surface-inverse-muted backdrop-blur-[2px] text-neutral-800 hover:bg-muted aria-pressed:bg-surface-inverse-muted disabled:text-text-inactive-light size-7 lg:size-10 rounded-full p-3 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Toggle({
  className,
  variant,
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
