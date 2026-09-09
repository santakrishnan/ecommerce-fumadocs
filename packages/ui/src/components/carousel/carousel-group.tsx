"use client"

import * as React from "react"
import { type UseEmblaCarouselType } from "embla-carousel-react"

import { cn } from "@/lib/utils"
import { getCurrentScrollOffset } from "./carousel.helpers"

type CarouselApi = UseEmblaCarouselType[1]

interface GroupRegistryEntry {
  groupRef: React.RefObject<HTMLDivElement | null>
  labelRef: React.RefObject<HTMLDivElement | null>
}

interface GroupRegistryContextValue {
  register: (id: string, entry: GroupRegistryEntry) => void
  unregister: (id: string) => void
  entries: Map<string, GroupRegistryEntry>
}

const GroupRegistryContext =
  React.createContext<GroupRegistryContextValue | null>(null)

function useGroupRegistry(): {
  entriesRef: React.RefObject<Map<string, GroupRegistryEntry>>
  registryValue: GroupRegistryContextValue
} {
  const entriesRef = React.useRef<Map<string, GroupRegistryEntry>>(new Map())

  const register = React.useCallback((id: string, entry: GroupRegistryEntry) => {
    entriesRef.current.set(id, entry)
  }, [])

  const unregister = React.useCallback((id: string) => {
    entriesRef.current.delete(id)
  }, [])

  const registryValue = React.useMemo<GroupRegistryContextValue>(
    () => ({ register, unregister, entries: entriesRef.current }),
    [register, unregister]
  )

  return { entriesRef, registryValue }
}

interface GroupGeometry {
  groupOffsetLeft: number
  groupWidth: number
  labelWidth: number
}

function computeStickyTransforms(
  scrollLeft: number,
  groups: GroupGeometry[]
): number[] {
  return groups.map(({ groupOffsetLeft, groupWidth, labelWidth }) => {
    const maxTranslate = groupWidth - labelWidth
    const rawTranslate = scrollLeft - groupOffsetLeft
    return Math.max(0, Math.min(rawTranslate, maxTranslate))
  })
}

function useStickyLabels(
  api: CarouselApi | undefined,
  enabled: boolean,
  entriesRef: React.RefObject<Map<string, GroupRegistryEntry>>
): void {
  const geometryCacheRef = React.useRef<GroupGeometry[]>([])

  React.useEffect(() => {
    if (!api || !enabled) return

    // Respect prefers-reduced-motion: skip transform-based sticky positioning
    // when the user prefers reduced motion. The labels remain static in their
    // natural position (no jarring translate updates on every scroll frame).
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (motionQuery.matches) return

    // Only activate for horizontal carousels
    const engine = api.internalEngine()
    if (engine.options.axis !== "x") return

    function measureGeometry() {
      if (!api) return

      const viewportNode = api.rootNode()
      const viewportLeft = viewportNode.getBoundingClientRect().left
      const currentScrollLeft = getCurrentScrollOffset(api)
      const entries = [...entriesRef.current.values()]

      geometryCacheRef.current = entries.map(({ groupRef, labelRef }) => {
        const groupEl = groupRef.current
        const labelEl = labelRef.current

        if (!groupEl || !labelEl) {
          return { groupOffsetLeft: 0, groupWidth: 0, labelWidth: 0 }
        }

        const groupRect = groupEl.getBoundingClientRect()
        const labelRect = labelEl.getBoundingClientRect()

        return {
          groupOffsetLeft: groupRect.left - viewportLeft + currentScrollLeft,
          groupWidth: groupRect.width,
          labelWidth: labelRect.width,
        }
      })
    }

    measureGeometry()

    function onScroll() {
      if (!api) return

      const scrollLeft = getCurrentScrollOffset(api)
      const entries = [...entriesRef.current.values()]

      const transforms = computeStickyTransforms(
        scrollLeft,
        geometryCacheRef.current
      )

      for (let i = 0; i < transforms.length; i++) {
        const labelEl = entries[i]?.labelRef.current
        if (labelEl) {
          const tx = transforms[i] ?? 0
          if (tx > 0) {
            // Subtract paddingLeft so pinned label text is flush with viewport edge
            const paddingLeft = parseFloat(getComputedStyle(labelEl).paddingLeft) || 0
            labelEl.style.transform = `translateX(${tx - paddingLeft}px)`
          } else {
            labelEl.style.transform = ""
          }
        }
      }
    }

    api.on("scroll", onScroll)

    function onReInit() {
      measureGeometry()
      onScroll()
    }

    api.on("reInit", onReInit)

    // ResizeObserver to update geometry when elements resize
    const resizeObserver = new ResizeObserver(() => {
      measureGeometry()
      onScroll()
    })

    const currentEntries = [...entriesRef.current.values()]
    for (const { groupRef, labelRef } of currentEntries) {
      if (groupRef.current) resizeObserver.observe(groupRef.current)
      if (labelRef.current) resizeObserver.observe(labelRef.current)
    }

    // Run once on mount after measurement
    onScroll()

    return () => {
      api.off("scroll", onScroll)
      api.off("reInit", onReInit)
      resizeObserver.disconnect()
    }
  }, [api, enabled, entriesRef])
}

/**
 * Group sections inside CarouselContent.
 *
 * note: CarouselGroup supports horizontal orientation only.
 * Vertical orientation with CarouselGroup is not supported.
 *
 * Grid alignment: when carousel items use `colSpan` sizing, the group
 * automatically snaps its width to the nearest full PageGrid column boundary.
 * If the group label (title/subtitle with whitespace-nowrap) is wider than
 * the items below it, the group expands to the next column multiple so the
 * following group starts on a clean column edge.
 *
 * This snapping is automatic — no manual `data-group-span` attribute needed.
 * The group reads `--page-grid-col-width` and `--page-grid-gap` from CSS to
 * compute the column unit, then rounds up its min-width accordingly.
 *
 * @example
 * ```tsx
 * <CarouselGroup>
 *   <CarouselGroupLabel title="Continue Shopping" subtitle="Based on your recent browsing history" />
 *   <CarouselItem colSpan={2}>...</CarouselItem>
 *   <CarouselItem colSpan={2}>...</CarouselItem>
 * </CarouselGroup>
 * ```
 */
interface CarouselGroupProps extends React.ComponentProps<"div"> {
  /**
   * Disable automatic grid-snap sizing for this group.
   * When true, the group's width is determined purely by its content.
   * @default false
   */
  disableGridSnap?: boolean
}

function CarouselGroup({
  className,
  children,
  disableGridSnap = false,
  ...props
}: CarouselGroupProps) {
  // Grouped layout and sticky/sub-item behaviors are designed for horizontal
  // carousels only. Vertical orientation with CarouselGroup is not supported.
  const groupRef = React.useRef<HTMLDivElement | null>(null)
  const labelRef = React.useRef<HTMLDivElement | null>(null)
  const itemsContainerRef = React.useRef<HTMLDivElement | null>(null)
  const registry = React.useContext(GroupRegistryContext)
  const id = React.useId()

  React.useEffect(() => {
    if (!registry) return
    registry.register(id, { groupRef, labelRef })
    return () => {
      registry.unregister(id)
    }
  }, [id, registry])

  // Automatic grid-snap: measure label vs items width and round up to
  // the nearest full column boundary when the label overflows the items.
  React.useEffect(() => {
    if (disableGridSnap) return

    const groupEl = groupRef.current
    const labelEl = labelRef.current
    const itemsEl = itemsContainerRef.current
    if (!groupEl || !labelEl || !itemsEl) return

    // Reuse one hidden measuring element for token-to-px resolution.
    // This avoids creating/removing nodes on every ResizeObserver callback.
    const measureEl = document.createElement("div")
    measureEl.style.position = "absolute"
    measureEl.style.visibility = "hidden"
    measureEl.style.pointerEvents = "none"
    document.body.appendChild(measureEl)

    function readTokenPx(tokenName: string): number {
      measureEl.style.width = `var(${tokenName})`
      return measureEl.getBoundingClientRect().width
    }

    function snapToGrid() {
      const groupElement = groupRef.current
      const labelElement = labelRef.current
      const itemsElement = itemsContainerRef.current
      if (!groupElement || !labelElement || !itemsElement) return

      // Read grid tokens from CSS custom properties.
      // Values may resolve from calc(), so convert token values to px by
      // measuring through a hidden element.
      const colWidth = readTokenPx("--page-grid-col-width")
      const gap = readTokenPx("--page-grid-gap")

      // If tokens aren't available/valid (e.g. theme not loaded), skip snapping
      if (!Number.isFinite(colWidth) || colWidth <= 0) {
        groupElement.style.removeProperty("min-width")
        return
      }

      if (!Number.isFinite(gap) || gap < 0) {
        groupElement.style.removeProperty("min-width")
        return
      }

      // Temporarily remove min-width so measurements aren't affected
      const prevMinWidth = groupElement.style.minWidth
      groupElement.style.minWidth = ""

      // Measure the items' natural total width (all items + gaps between them)
      const items = itemsElement.querySelectorAll<HTMLElement>(
        "[data-slot='carousel-item']"
      )
      let itemsNaturalWidth = 0
      if (items.length > 0) {
        for (const item of items) {
          itemsNaturalWidth += item.getBoundingClientRect().width
        }
        // Add inter-item gaps
        itemsNaturalWidth += (items.length - 1) * gap
      }

      // Measure the label's intrinsic width (scrollWidth gives content width)
      const labelWidth = labelElement.scrollWidth

      // Restore previous min-width before deciding
      groupElement.style.minWidth = prevMinWidth

      // Only snap if label overflows the items' natural width
      if (labelWidth <= itemsNaturalWidth) {
        groupElement.style.removeProperty("min-width")
        return
      }

      // Column unit = one column + one gap (the repeating rhythm unit).
      const colUnit = colWidth + gap
      if (!Number.isFinite(colUnit) || colUnit <= 0) {
        groupElement.style.removeProperty("min-width")
        return
      }

      // Compute how many full columns the group needs to span.
      // The group's total width + the track gap after it should place
      // the next group's start on a column boundary.
      //
      // group_width = N*col + (N-1)*gap  (so that group_width + gap = N*colUnit)
      //
      // We need: N*col + (N-1)*gap >= labelWidth
      // Solving: N >= (labelWidth + gap) / (col + gap)
      const colsNeeded = Math.max(1, Math.ceil((labelWidth + gap) / colUnit))

      // Snapped width = N columns + (N-1) gaps
      const snappedWidth = colsNeeded * colWidth + (colsNeeded - 1) * gap
      if (!Number.isFinite(snappedWidth)) {
        groupElement.style.removeProperty("min-width")
        return
      }

      // Only apply if the snapped width exceeds the items' natural width
      if (snappedWidth > itemsNaturalWidth) {
        groupElement.style.minWidth = `${snappedWidth}px`
      } else {
        groupElement.style.removeProperty("min-width")
      }
    }

    snapToGrid()

    // Re-measure on resize (viewport changes affect col-width)
    const resizeObserver = new ResizeObserver(() => {
      snapToGrid()
    })

    resizeObserver.observe(groupEl)
    if (labelEl) resizeObserver.observe(labelEl)
    if (itemsEl) resizeObserver.observe(itemsEl)

    return () => {
      resizeObserver.disconnect()
      if (measureEl.isConnected) {
        document.body.removeChild(measureEl)
      }
      groupEl.style.removeProperty("min-width")
    }
  }, [disableGridSnap])

  const childArray = React.Children.toArray(children)

  const labelChildren: React.ReactNode[] = []
  const itemChildren: React.ReactNode[] = []

  for (const child of childArray) {
    if (
      React.isValidElement(child) &&
      (child.type as { displayName?: string })?.displayName ===
        "CarouselGroupLabel"
    ) {
      labelChildren.push(
        React.cloneElement(
          child as React.ReactElement<{ labelRef?: React.RefObject<HTMLDivElement | null> }>,
          { labelRef }
        )
      )
    } else {
      itemChildren.push(child)
    }
  }

  return (
    <div
      ref={groupRef}
      data-slot="carousel-group"
      className={cn("flex flex-col relative", className)}
      {...props}
    >
      {labelChildren}
      <div ref={itemsContainerRef} className="mt-auto flex gap-(--page-grid-gap)">{itemChildren}</div>
    </div>
  )
}

interface CarouselGroupLabelBaseProps extends React.ComponentProps<"div"> {
  titleProps?: React.ComponentProps<"span">
  subtitleProps?: React.ComponentProps<"span">
}

type CarouselGroupLabelContentProps = {
  title: string
  subtitle?: string
}

type CarouselGroupLabelProps = CarouselGroupLabelBaseProps &
  CarouselGroupLabelContentProps

type CarouselGroupLabelInternalProps = CarouselGroupLabelProps & {
  /** Internally injected by CarouselGroup for sticky label positioning */
  labelRef?: React.RefObject<HTMLDivElement | null>
}

function CarouselGroupLabel({
  title,
  subtitle,
  titleProps,
  subtitleProps,
  className,
  labelRef,
  ...props
}: CarouselGroupLabelInternalProps) {
  if (!title) return null

  const {
    className: titleClassName,
    ...titleSpanProps
  } = titleProps ?? {}
  const {
    className: subtitleClassName,
    ...subtitleSpanProps
  } = subtitleProps ?? {}

  return (
    <div
      ref={labelRef}
      data-slot="carousel-group-label"
      className={cn("w-fit self-start flex flex-col gap-1 pb-4", className)}
      {...props}
    >
      <span
        className={cn("block whitespace-nowrap carousel-headline text-text-primary", titleClassName)}
        {...titleSpanProps}
      >
        {title}
      </span>
      {subtitle && (
        <span
          className={cn(
            "block whitespace-nowrap body-md text-text-secondary",
            subtitleClassName
          )}
          {...subtitleSpanProps}
        >
          {subtitle}
        </span>
      )}
    </div>
  )
}

CarouselGroupLabel.displayName = "CarouselGroupLabel"

export {
  CarouselGroup,
  CarouselGroupLabel,
  GroupRegistryContext,
  computeStickyTransforms,
  useGroupRegistry,
  useStickyLabels,
}

export type {
  CarouselApi,
  CarouselGroupLabelBaseProps,
  CarouselGroupLabelContentProps,
  CarouselGroupLabelInternalProps,
  CarouselGroupLabelProps,
  CarouselGroupProps,
  GroupGeometry,
  GroupRegistryEntry,
  GroupRegistryContextValue,
}
