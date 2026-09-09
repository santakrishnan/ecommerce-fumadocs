"use client"

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"
import type { Surface } from "@/lib/types"

/* ─── TooltipProvider ─── */

interface TooltipProviderProps extends TooltipPrimitive.Provider.Props {}

function TooltipProvider({
  delay = 0,
  ...props
}: TooltipProviderProps) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  )
}

/* ─── Tooltip (Root) ─── */

interface TooltipProps extends TooltipPrimitive.Root.Props {}

function Tooltip({ ...props }: TooltipProps) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

/* ─── TooltipTrigger ─── */

interface TooltipTriggerProps extends TooltipPrimitive.Trigger.Props {}

function TooltipTrigger({ ...props }: TooltipTriggerProps) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

/* ─── TooltipContent ─── */

type TooltipContentProps = TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  > & {
    /** @deprecated Arrow has been removed — this prop is retained for backward compatibility and has no effect. */
    arrowClassName?: string
    /** Surface context — sets data-surface on the portal popup for token resolution */
    surface?: Surface
  }

function TooltipContent({
  className,
  arrowClassName: _arrowClassName,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  surface,
  children,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          {...(surface !== undefined ? { "data-surface": surface } : {})}
          className={cn(
            // Layout
            "z-50 inline-flex w-fit max-w-xs items-center gap-1.5",
            // Transform origin
            "origin-(--transform-origin)",
            // Shape & color — hotspot text container style
            "rounded-lg px-3 py-2",
            "surface-light:bg-surface-inverse-muted surface-dark:bg-surface-glass-dark",
            // Typography — Body Small
            "body-sm text-text-primary",
            // Kbd slot adjustments
            "has-data-[slot=kbd]:pr-1.5",
            "**:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm",
            // Enter animations
            "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            // Exit animations
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            // Slide-in per side
            "data-[side=bottom]:slide-in-from-top-2",
            "data-[side=top]:slide-in-from-bottom-2",
            "data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2",
            "data-[side=inline-end]:slide-in-from-left-2",
            "data-[side=inline-start]:slide-in-from-right-2",
            className
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
export type {
  TooltipProps,
  TooltipTriggerProps,
  TooltipContentProps,
  TooltipProviderProps,
}
