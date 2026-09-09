"use client"

import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"
import type { Surface } from "@/lib/types"

/* ─── Hotspot (Root) ─── */

interface HotspotProps extends PopoverPrimitive.Root.Props {}

function Hotspot({ ...props }: HotspotProps) {
  return <PopoverPrimitive.Root data-slot="hotspot" {...props} />
}

/* ─── HotspotTrigger ─── */

type HotspotTriggerProps = Omit<
  PopoverPrimitive.Trigger.Props,
  "render" | "openOnHover" | "delay" | "closeDelay"
> & {
  /** Accessible label for the trigger button (required — icon-only button) */
  "aria-label": string
  /** Absolute position within a relative parent */
  position?: { top: string; left: string }
}

function HotspotTrigger({
  className,
  position,
  ...props
}: HotspotTriggerProps) {
  return (
    <div
      data-slot="hotspot-trigger-wrapper"
      className={cn(
        // Layout & positioning
        "absolute size-8",
        className
      )}
      style={
        position
          ? { top: position.top, left: position.left }
          : undefined
      }
    >
      <PopoverPrimitive.Trigger
        data-slot="hotspot-trigger"
        openOnHover
        delay={0}
        closeDelay={0}
        render={
          <button
            type="button"
            className={cn(
              // Layout
              "group relative inline-flex size-8 items-center justify-center",
              // Shape - 32px circle per Figma node 7009-2573
              "rounded-full",
              // Color - outer circle: black @ 22%, border: white @ 60%
              "border border-surface-primary/60 bg-black/33",
              // Hover and selected/open - border becomes solid white
              "hover:border-surface-primary data-popup-open:border-surface-primary",
              // Focus ring — matches shared ring pattern
              "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring"
            )}
          />
        }
        {...props}
      >
        <span
          data-slot="hotspot-dot"
          className={cn(
            // Inner dot - 12px (r=6) white circle
            "size-3 rounded-full bg-surface-primary",
            // Hover and selected/open - shrinks to 8px (r=4) per Figma hover state
            "transition-transform group-hover:scale-[0.667] group-data-popup-open:scale-[0.667]"
          )}
        />
      </PopoverPrimitive.Trigger>
    </div>
  )
}

/* ─── HotspotContent ─── */

type HotspotContentProps = PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  > & {
    /** Surface context — sets data-surface on the portal popup for token resolution */
    surface?: Surface
  }

function HotspotContent({
  className,
  side = "top",
  sideOffset = 8,
  align = "center",
  alignOffset = 0,
  surface,
  children,
  ...props
}: HotspotContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="hotspot-content"
          {...(surface !== undefined ? { "data-surface": surface } : {})}
          className={cn(
            // Layout
            "z-50 inline-flex w-fit max-w-xs items-center gap-1.5",
            // Transform origin
            "origin-(--transform-origin)",
            // Shape & color — surface-aware background
            "rounded-lg px-3 py-2",
            "surface-light:bg-surface-glass-light surface-dark:bg-surface-glass-dark glass",
            // Typography — Body Small
            "body-sm text-text-primary",
            // Enter animations
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
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Hotspot, HotspotTrigger, HotspotContent }
export type { HotspotProps, HotspotTriggerProps, HotspotContentProps }
