"use client"

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"
import type { Surface } from "@/lib/types"
import { Button } from "@/components/button"
import { IconClose } from "@/icons"

const pillVariants = cva([
  // Layout & shape
  "inline-flex items-center gap-2 rounded-full border min-h-12",
  // Spacing — 12px top/bottom, 24px left/right
  // Auto-reduces to 20px on the side where data-icon="inline-start/end" is present as a child
  "py-3 px-6",
  "has-data-[icon=inline-start]:ps-5",
  "has-data-[icon=inline-end]:pe-5",
  // SVG normalisation — consumers can pass any element; svgs get sized automatically
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  // Typography — Body-Small
  "text-xs leading-body tracking-tighter text-text-secondary-light aria-pressed:text-text-primary-light whitespace-nowrap",
  // Transitions
  "transition-colors duration-200 motion-reduce:transition-none",
  "outline-none select-none",
  // Disabled (aria-disabled for non-native button element)
  "aria-disabled:pointer-events-none aria-disabled:opacity-50",
  // Focus ring
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  // Validation
  "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  // Light surface — unselected
  "surface-light:bg-surface-primary/70 surface-light:border-neutral-200",
  // Light surface — hover (unselected): border to grey mid, text to primary
  "surface-light:hover:not-aria-disabled:not-aria-pressed:border-neutral-400 surface-light:hover:not-aria-disabled:not-aria-pressed:text-text-primary-light",
  // Light surface — selected
  "surface-light:aria-pressed:bg-surface-primary surface-light:aria-pressed:border-neutral-500",
  // Light surface — hover (selected): text softens to secondary
  "surface-light:hover:not-aria-disabled:aria-pressed:text-text-secondary-light",
  // Dark surface — no border in any state including hover
  "surface-dark:border-transparent surface-dark:hover:border-transparent surface-dark:aria-pressed:border-transparent",
  // Dark surface — unselected default: white at 70%
  "surface-dark:bg-surface-primary/70",
  // Dark surface — unselected hover: white at 90%
  "surface-dark:hover:not-aria-disabled:not-aria-pressed:bg-surface-primary/90",
  // Dark surface — unselected hover: text goes to primary (black)
  "surface-dark:hover:not-aria-disabled:not-aria-pressed:text-text-primary-light",
  // Dark surface — selected default: solid white
  "surface-dark:aria-pressed:bg-surface-primary",
  // Dark surface — selected hover: text softens to secondary
  "surface-dark:hover:not-aria-disabled:aria-pressed:text-text-secondary-light",
  // When close button is present, reduce right padding to keep visual balance
  "has-data-[slot=pill-close]:pe-5",
])


type PillProps = TogglePrimitive.Props & {
  surface?: Surface
  hideClose?: boolean
  className?: string
}

function Pill({
  surface,
  hideClose = false,
  className,
  children,
  onPressedChange,
  ...props
}: PillProps) {
  return (
    <TogglePrimitive
      data-slot="pill"
      nativeButton={false}
      {...(surface !== undefined ? { "data-surface": surface } : {})}
      className={cn(pillVariants(), className)}
      onPressedChange={onPressedChange}
      render={(renderProps, state) => {
        const showCloseButton = !hideClose && state.pressed && !state.disabled

        const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
          if (state.pressed && !hideClose) return
          renderProps.onClick?.(e)
        }

        const triggerUnselect = (e: React.SyntheticEvent) => {
          e.stopPropagation()
          e.preventDefault()
          if (!state.pressed || state.disabled) return
          renderProps.onClick?.(e as React.MouseEvent<HTMLSpanElement>)
        }

        return (
          <span {...renderProps} onClick={handleClick}>
            {children}
            {showCloseButton && (
              <Button
                data-slot="pill-close"
                aria-label="Remove"
                tabIndex={0}
                size="icon"
                surface="dark"
                className="size-5 [&_svg:not([class*='size-'])]:size-3"
                onClick={triggerUnselect}
                onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
                  if (e.key === "Enter" || e.key === " ") {
                    triggerUnselect(e)
                  }
                }}
              >
                <IconClose />
              </Button>
            )}
          </span>
        )
      }}
      {...props}
    />
  )
}

type PillGroupProps = ToggleGroupPrimitive.Props & {
  surface?: Surface
  density?: "compact" | "standard"
  className?: string
}

function PillGroup({
  surface,
  density,
  className,
  ...props
}: PillGroupProps) {
  return (
    <ToggleGroupPrimitive
      data-slot="pill-group"
      {...(surface !== undefined ? { "data-surface": surface } : {})}
      className={cn(
        "group flex flex-wrap",
        density === "compact" ? "gap-1" : "gap-2",
        className
      )}
      {...props}
    />
  )
}

export type { PillProps, PillGroupProps }
export { Pill, PillGroup }
