"use client"

import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures"

import type { Surface } from "@/lib";
import { cn } from "@/lib/utils"
import {Button, type ButtonProps} from "@/components/button"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import {
  GroupRegistryContext,
  useGroupRegistry,
  useStickyLabels,
} from "./carousel-group"
import {
  getAlignedSnapOffset,
  getCurrentScrollOffset,
  getFocusedItemIndex,
  getNearestItemIndexFromViewportStart,
  getProjectedScrollOffset,
  isGroupedHorizontalTrack,
  scrollBySubitemStep,
} from "./carousel.helpers"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

// TODO when themes come in we need to look into ways of getting these values from the theme instead of hardcoding them here.
// Derived from `--shadow-hover: 0 2px 4px 0 ...`.
// We use a conservative symmetric vertical buffer to keep both top and bottom shadow visible.
const HOVER_SHADOW_OVERFLOW_X_PX = 4
const HOVER_SHADOW_OVERFLOW_Y_PX = 6

// Default Embla options. Merged with any consumer-provided `opts` so partial
// overrides (e.g. `{ align: "center" }`) keep the remaining defaults — notably
// `dragFree: true`, which the snap-on-release behavior depends on.
const DEFAULT_CAROUSEL_OPTS: CarouselOptions = {
  align: "start",
  dragFree: true,
}

interface CarouselButtonProps extends ButtonProps {}

interface CarouselProps extends React.ComponentProps<"div"> {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  /**
   * Optional hover scale ratio for carousel items (for example, 1.025).
   * When provided and greater than 1, viewport inset is computed automatically
   * so scaled items and hover shadows are not clipped.
   *
   * note: Omitting this prop or setting it to 1 disables the hover scale effect and additional inset.
   */
  hoverScaleRatio?: number
  /**
   * Surface color for the carousel, which controls the default arrow color and can be used by consumers to style child content.
   */
  surface?: Surface
  /** Enable infinite loop scrolling. Defaults to false. */
  loop?: boolean
  /**
   * Disable the default arrow navigation buttons.
   * When true, built-in arrows are hidden but explicitly provided
   * CarouselPrevious/CarouselNext children still render.
   * When using explicit arrows, pair with `disableArrows={true}` to avoid duplicates.
   * Defaults to false.
   */
  disableArrows?: boolean
  /**
   * When true, group labels pin at the left edge of the carousel viewport
   * during horizontal scroll, yielding to the next group's label at the
   * group boundary.
   *
   * note: CarouselGroup supports horizontal orientation only.
   * Vertical orientation with CarouselGroup is not supported.
   * @default true
   */
  stickyGroupLabels?: boolean
  /**
   * When true, arrow buttons and keyboard navigation scroll one individual
   * CarouselItem at a time instead of one slide/group at a time.
   * Useful when CarouselGroup wraps multiple items and you want fine-grained
   * navigation through individual items.
   *
   * note: CarouselGroup supports horizontal orientation only.
   * Vertical orientation with CarouselGroup is not supported.
   * @default true
   */
  scrollBySubitem?: boolean
  /**
   * Disable grid-snap-on-release for horizontal drag-free carousels.
   * By default, when `dragFree` is enabled the track eases to rest with the
   * nearest item aligned to the start edge (or the last item's right edge at
   * the end of the track). Set this to true to keep pure free scrolling, where
   * the track comes to rest wherever momentum stops.
   *
   * note: Only affects horizontal carousels with `dragFree` enabled.
   * @default false
   */
  disableSnap?: boolean
  setApi?: (api: CarouselApi) => void
  /**
   * Props forwarded to both the `CarouselPrevious` and `CarouselNext` arrow
   * buttons. Use this to customize their `variant`, `size`, `surface`, or any
   * other {@link ButtonProps} — without having to render the arrows yourself.
   *
   * @example
   * ```tsx
   * <Carousel buttonProps={{ variant: "secondary", surface: "dark" }}>
   *   …
   * </Carousel>
   * ```
   */
  buttonProps?: ButtonProps
}

interface CarouselContextProps extends Omit<
  CarouselProps,
  "disableArrows" | "stickyGroupLabels" | "scrollBySubitem" | "disableSnap" | "buttonProps"
> {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
  stickyGroupLabels: boolean
  scrollBySubitem: boolean
}

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

function Carousel({
  orientation = "horizontal",
  opts,
  hoverScaleRatio,
  loop = false,
  surface,
  disableArrows = false,
  stickyGroupLabels = true,
  scrollBySubitem = true,
  disableSnap = false,
  setApi,
  plugins,
  className,
  children,
  buttonProps,
  ...props
}: CarouselProps) {
  // Merge consumer opts over the defaults so a partial `opts` keeps the
  // defaults it doesn't override (e.g. `dragFree`, which snapping relies on).
  const mergedOpts = { ...DEFAULT_CAROUSEL_OPTS, ...opts }
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...mergedOpts,
      loop,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    [...(plugins ?? []), WheelGesturesPlugin()]
  )
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)
  const isHorizontalSubitemMode =
    scrollBySubitem && orientation === "horizontal"
  const isDragFreeEnabled = mergedOpts.dragFree === true

  const currentScrollOffset = React.useCallback(
    () => getCurrentScrollOffset(api),
    [api]
  )

  const isGroupedTrack = React.useCallback(
    () => isGroupedHorizontalTrack(api, orientation),
    [api, orientation]
  )

  // Single-group detection: when there's only one direct child (a group) with
  // multiple items inside, tell Embla to treat items as slides via reInit.
  // Multi-group keeps the default behavior (groups as slides).
  const hasAppliedItemSlides = React.useRef(false)
  React.useEffect(() => {
    if (!api) return

    const containerNode = api.containerNode()
    const directChildren = containerNode.children

    // Single group with multiple items: tell Embla to use items as slides
    if (directChildren.length === 1 && !hasAppliedItemSlides.current) {
      const items =
        containerNode.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]')
      if (items.length > 1) {
        hasAppliedItemSlides.current = true
        api.reInit({ slides: '[data-slot="carousel-item"]' })
      }
    }

    return () => {
      hasAppliedItemSlides.current = false
    }
  }, [api])

  const onSelect = React.useCallback(
    (api: CarouselApi) => {
      if (!api) return

      if (!isHorizontalSubitemMode || loop) {
        setCanScrollPrev(api.canScrollPrev())
        setCanScrollNext(api.canScrollNext())
        return
      }

      // In sub-item mode, scroll can stop between Embla snaps (groups), so
      // snap-based canScroll* can disable arrows too early.
      const hasOverflow = api.canScrollPrev() || api.canScrollNext()
      if (!hasOverflow) {
        setCanScrollPrev(false)
        setCanScrollNext(false)
        return
      }

      const EDGE_EPSILON = 0.001
      const progress = api.scrollProgress()
      setCanScrollPrev(progress > EDGE_EPSILON)
      setCanScrollNext(progress < 1 - EDGE_EPSILON)
    },
    [isHorizontalSubitemMode, loop]
  )

  const scrollPrev = React.useCallback(() => {
    if (!api) return
    if (isHorizontalSubitemMode) {
      const handled = scrollBySubitemStep(api, "prev")
      if (!handled) {
        api.scrollPrev()
      }
    } else {
      api.scrollPrev()
    }
  }, [api, isHorizontalSubitemMode])

  const scrollNext = React.useCallback(() => {
    if (!api) return
    if (isHorizontalSubitemMode) {
      const handled = scrollBySubitemStep(api, "next")
      if (!handled) {
        api.scrollNext()
      }
    } else {
      api.scrollNext()
    }
  }, [api, isHorizontalSubitemMode])

  const nearestItemIndexFromStart = React.useCallback(
    (items: NodeListOf<HTMLElement>) => {
      return getNearestItemIndexFromViewportStart(api, items)
    },
    [api]
  )

  const scrollToItem = React.useCallback(
    (
      item: HTMLElement,
      index: number,
      jump = false,
      forceSubitem = false
    ) => {
      if (!api) return

      if (!isHorizontalSubitemMode && !forceSubitem) {
        api.scrollTo(index)
        return
      }

      const engine = api.internalEngine()
      const viewportLeft = api.rootNode().getBoundingClientRect().left
      const itemLeft = item.getBoundingClientRect().left
      const distanceToStart = itemLeft - viewportLeft

      const currentScroll = currentScrollOffset()
      const maxScroll = -engine.limit.min
      const targetScroll = Math.max(
        0,
        Math.min(currentScroll + distanceToStart, maxScroll)
      )
      const distanceToTarget = targetScroll - currentScroll

      if (Math.abs(distanceToTarget) <= 0.5) return

      if (jump) {
        // Keep held-arrow movement smooth while avoiding abrupt snaps.
        engine.scrollBody.useDuration(18)
      } else {
        engine.scrollBody.useBaseDuration()
      }
      engine.scrollTo.distance(-distanceToTarget, false)
    },
    [api, currentScrollOffset, isHorizontalSubitemMode]
  )

  // Disable drag and wheel gestures when content doesn't overflow the container.
  // Uses a ref to track state and avoid re-init loops.
  const isDragDisabled = React.useRef(false)
  React.useEffect(() => {
    if (!api) return

    function updateDragState() {
      if (!api) return
      const canScroll = api.canScrollPrev() || api.canScrollNext()

      if (!canScroll && !isDragDisabled.current) {
        isDragDisabled.current = true
        api.reInit({ watchDrag: false })
      } else if (canScroll && isDragDisabled.current) {
        isDragDisabled.current = false
        api.reInit({ watchDrag: true })
      }
    }

    updateDragState()
    api.on("reInit", updateDragState)

    return () => {
      api.off("reInit", updateDragState)
    }
  }, [api])

  // Detect real drags and block the post-drag synthetic click that would
  // otherwise navigate to the card detail page.
  //
  // Embla fires scroll via requestAnimationFrame, so it arrives after the
  // mouseup/click sequence — too late to set any attribute or flag. Instead
  // we use raw DOM pointer events with a displacement threshold so the drag
  // flag is set synchronously during the interaction.
  // A capture-phase click listener then intercepts the click before it
  // reaches any child link or button.
  React.useEffect(() => {
    if (!api) return

    const viewport = api.rootNode()
    const isHorizontal = orientation === "horizontal"
    const DRAG_THRESHOLD_PX = 5
    let startX = 0
    let startY = 0
    let hasDragged = false

    function onPointerDown(e: PointerEvent) {
      startX = e.clientX
      startY = e.clientY
      hasDragged = false
    }

    function onPointerMove(e: PointerEvent) {
      if (hasDragged) return
      const dx = Math.abs(e.clientX - startX)
      const dy = Math.abs(e.clientY - startY)
      const axisDelta = isHorizontal ? dx : dy
      if (axisDelta > DRAG_THRESHOLD_PX) {
        hasDragged = true
      }
    }

    function onPointerUp() {
      if (!hasDragged) return
      hasDragged = false

      // Register a one-time window-level capture listener.
      // window fires before document in the capture phase, so this blocks
      // the post-drag click before any document-level listener
      // (e.g. a hero-transition provider) can intercept it and start
      // navigation. Self-contained — no per-app changes required.
      function blockDragClick(e: MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
      }
      window.addEventListener("click", blockDragClick, { capture: true, once: true })
      // Safety net: remove if no click follows within 300 ms (e.g. touch cancel).
      setTimeout(() => window.removeEventListener("click", blockDragClick, { capture: true }), 300)
    }

    function onClickCapture(e: MouseEvent) {
      if (hasDragged) {
        e.preventDefault()
        e.stopPropagation()
        hasDragged = false
      }
    }

    viewport.addEventListener("pointerdown", onPointerDown)
    viewport.addEventListener("pointermove", onPointerMove)
    viewport.addEventListener("pointerup", onPointerUp)
    viewport.addEventListener("click", onClickCapture, { capture: true })

    return () => {
      viewport.removeEventListener("pointerdown", onPointerDown)
      viewport.removeEventListener("pointermove", onPointerMove)
      viewport.removeEventListener("pointerup", onPointerUp)
      viewport.removeEventListener("click", onClickCapture, { capture: true })
    }
  }, [api, orientation])

  // Grid-snap on release for any horizontal drag-free carousel.
  //
  // With `dragFree`, Embla lets the track glide freely and would otherwise come
  // to rest at an arbitrary offset. On every release — mouse drag, touch, and
  // trackpad wheel (the wheel-gestures plugin synthesizes mouse events through
  // Embla's own drag handler) — Embla emits `pointerUp` *after* setting its
  // internal target to the momentum landing point. We read that projected
  // resting offset, compute the nearest item-aligned offset, and redirect the
  // target. The in-flight momentum then eases to the aligned offset in one
  // continuous motion, so cards always come to rest aligned to the start edge
  // (or the far edge at the end of the track) without a second, visibly
  // separate snap animation.
  //
  // This runs for every horizontal drag-free carousel — not just sub-item mode.
  // The alignment is padding-aware (see getAlignedSnapOffset), so carousels with
  // leading track padding keep that inset intact.
  React.useEffect(() => {
    if (!api) return
    if (orientation !== "horizontal" || !isDragFreeEnabled || disableSnap) return
    const emblaApi = api

    function snapToGridOnRelease() {
      const projected = getProjectedScrollOffset(emblaApi)
      const alignedOffset = getAlignedSnapOffset(emblaApi, projected)
      if (alignedOffset === null) return

      const engine = emblaApi.internalEngine()
      // Redirect the momentum target (Embla stores scroll as a negative offset)
      // and keep the animation running so the existing glide eases into place.
      engine.target.set(-alignedOffset)
      engine.animation.start()
    }

    emblaApi.on("pointerUp", snapToGridOnRelease)

    return () => {
      emblaApi.off("pointerUp", snapToGridOnRelease)
    }
  }, [api, orientation, isDragFreeEnabled, disableSnap])

  const focusItemAtIndex = React.useCallback(
    (index: number, jump = false, forceSubitem = false) => {
      if (!api) return
      const rootNode = api.rootNode()
      const items = rootNode.querySelectorAll<HTMLElement>(
        "[data-slot='carousel-item']"
      )
      const item = items[index]
      if (!item) return

      // Prefer an explicit focus target marked with data-carousel-focus.
      // Falls back to the item itself (which has tabIndex={-1}, so .focus() works
      // programmatically but the item won't appear in the tab order).
      const focusTarget =
        item.querySelector<HTMLElement>("[data-carousel-focus]") ?? item
      focusTarget.focus({ preventScroll: true })

      // Scroll the item into view
      scrollToItem(item, index, jump, forceSubitem)
    },
    [api, scrollToItem]
  )

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!api) return
      const rootNode = api.rootNode()
      const items = rootNode.querySelectorAll<HTMLElement>(
        "[data-slot='carousel-item']"
      )
      const totalItems = items.length
      const shouldUseSubitemKeyboardScroll = isGroupedTrack()

      // Determine which item currently has focus (or contains the focused element)
      let currentIndex = getFocusedItemIndex(items, document.activeElement)
      // If focus is on the carousel root itself, start from the selected snap
      if (currentIndex === -1) {
        currentIndex = shouldUseSubitemKeyboardScroll
          ? nearestItemIndexFromStart(items)
          : api.selectedScrollSnap()
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault()
        const nextIndex = currentIndex > 0 ? currentIndex - 1 : 0
        focusItemAtIndex(nextIndex, event.repeat, shouldUseSubitemKeyboardScroll)
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        const nextIndex =
          currentIndex < totalItems - 1 ? currentIndex + 1 : totalItems - 1
        focusItemAtIndex(nextIndex, event.repeat, shouldUseSubitemKeyboardScroll)
      }
    },
    [
      api,
      focusItemAtIndex,
      isGroupedTrack,
      nearestItemIndexFromStart,
    ]
  )

  React.useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  React.useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on("reInit", onSelect)
    api.on("select", onSelect)
    api.on("scroll", onSelect)

    return () => {
      api.off("reInit", onSelect)
      api.off("select", onSelect)
      api.off("scroll", onSelect)
    }
  }, [api, onSelect])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts: mergedOpts,
        hoverScaleRatio,
        stickyGroupLabels,
        scrollBySubitem,
        orientation:
          orientation || (mergedOpts.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("group/carousel relative", className)}
        role="region"
        aria-roledescription="carousel"
        aria-label="carousel"
        tabIndex={0}
        data-slot="carousel"
        {...(surface !== undefined ? { "data-surface": surface } : {})}
        {...props}
      >
        {children}
        {!disableArrows && (
          <>
            {canScrollPrev && <CarouselPrevious {...buttonProps} />}
            {canScrollNext && <CarouselNext {...buttonProps} />}
          </>
        )}
      </div>
    </CarouselContext.Provider>
  )
}

interface CarouselContentProps extends React.ComponentProps<"div"> {}

function CarouselContent({ className, ...props }: CarouselContentProps) {
  const { carouselRef, api, orientation, hoverScaleRatio, stickyGroupLabels } =
    useCarousel()
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const hasAutoHoverEffects = (hoverScaleRatio ?? 1) > 1

  const { entriesRef, registryValue } = useGroupRegistry()

  useStickyLabels(api, stickyGroupLabels, entriesRef)

  // Measure label height and expose as CSS variable for button positioning.
  // When groups have labels, the carousel height grows but buttons should
  // center on the cards area, not the full height including labels.
  React.useEffect(() => {
    const viewportNode = viewportRef.current
    if (!viewportNode) return

    function updateLabelHeight() {
      const viewport = viewportRef.current
      if (!viewport) return
      const labels = viewport.querySelectorAll<HTMLElement>(
        '[data-slot="carousel-group-label"]'
      )
      let maxLabelHeight = 0
      for (const label of labels) {
        maxLabelHeight = Math.max(
          maxLabelHeight,
          label.getBoundingClientRect().height
        )
      }
      const carouselRoot = viewport.closest<HTMLElement>('[data-slot="carousel"]')
      if (carouselRoot) {
        carouselRoot.style.setProperty(
          "--carousel-label-height",
          `${maxLabelHeight}px`
        )
      }
    }

    updateLabelHeight()
    const observer = new ResizeObserver(updateLabelHeight)
    observer.observe(viewportNode)
    return () => observer.disconnect()
  }, [])

  const setViewportRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      viewportRef.current = node
      carouselRef(node)
    },
    [carouselRef]
  )

  React.useEffect(() => {
    const viewportNode = viewportRef.current
    if (!viewportNode) return

    const resolvedHoverScaleRatio = hoverScaleRatio ?? 1
    if (resolvedHoverScaleRatio <= 1) {
      viewportNode.style.removeProperty("--carousel-overflow-x")
      viewportNode.style.removeProperty("--carousel-overflow-y")
      viewportNode.style.removeProperty("--carousel-hover-scale-ratio")
      return
    }

    viewportNode.style.setProperty(
      "--carousel-hover-scale-ratio",
      `${resolvedHoverScaleRatio}`
    )

    function updateOverflowInset() {
      const currentViewportNode = viewportRef.current
      if (!currentViewportNode) return

      const items = currentViewportNode.querySelectorAll<HTMLElement>(
        "[data-slot='carousel-item']"
      )

      let maxItemWidth = 0
      let maxItemHeight = 0

      for (const item of items) {
        const rect = item.getBoundingClientRect()
        maxItemWidth = Math.max(maxItemWidth, rect.width)
        maxItemHeight = Math.max(maxItemHeight, rect.height)
      }

      const growthRatio = resolvedHoverScaleRatio - 1
      const overflowX = Math.max(0, (maxItemWidth * growthRatio) / 2)
      const overflowY = Math.max(0, (maxItemHeight * growthRatio) / 2)
      const overflowWithShadowX = overflowX + HOVER_SHADOW_OVERFLOW_X_PX
      const overflowWithShadowY = overflowY + HOVER_SHADOW_OVERFLOW_Y_PX

      currentViewportNode.style.setProperty(
        "--carousel-overflow-x",
        `${overflowWithShadowX}px`
      )
      currentViewportNode.style.setProperty(
        "--carousel-overflow-y",
        `${overflowWithShadowY}px`
      )
    }

    updateOverflowInset()

    const resizeObserver = new ResizeObserver(() => {
      updateOverflowInset()
    })
    resizeObserver.observe(viewportNode)

    const mutationObserver = new MutationObserver(() => {
      updateOverflowInset()
    })
    mutationObserver.observe(viewportNode, {
      childList: true,
      subtree: true,
    })

    return () => {
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [hoverScaleRatio])

  return (
    <GroupRegistryContext.Provider value={registryValue}>
      <div className="overflow-visible" data-slot="carousel-content">
        <div
          ref={setViewportRef}
          className={cn(
            "scrollbar-none [&::-webkit-scrollbar]:hidden",
            "px-(--carousel-overflow-x,0px)",
            "-mx-(--carousel-overflow-x,0)",
            "py-(--carousel-overflow-y,0px)",
            "-my-(--carousel-overflow-y,0)",
            hasAutoHoverEffects &&
              "[&_[data-slot='carousel-item']>*:first-child]:transition-[transform,scale,box-shadow] [&_[data-slot='carousel-item']>*:first-child]:duration-200 [&_[data-slot='carousel-item']:hover>*:first-child]:shadow-hover [&_[data-slot='carousel-item']:hover>*:first-child]:scale-(--carousel-hover-scale-ratio,1) [&_[data-slot='carousel-item']:focus-visible>*:first-child]:scale-(--carousel-hover-scale-ratio,1)",
            orientation === "horizontal"
              ? "overflow-x-auto cursor-grab touch-pan-y"
              : "overflow-y-auto"
          )}
        >
          <div
            data-slot="carousel-track"
            className={cn(
              "flex",
              orientation === "horizontal" ? "gap-2" : "gap-2 flex-col",
              className
            )}
            {...props}
          />
        </div>
      </div>
    </GroupRegistryContext.Provider>
  )
}

/** Allowed col-span values per breakpoint tier */
type ColSpanSm = 1 | 2 | 3 | 4
type ColSpanMd = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
/** lg and above (xl/2xl/3xl/4xl) all share the 12-column layout */
type ColSpanLg = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

interface ColSpanResponsive {
  /** Base span (mobile-first, < md) — 4-column grid */
  sm: ColSpanSm
  /** Tablet (>= 768px) — 8-column grid */
  md?: ColSpanMd
  /** Desktop (>= 1024px) — 12-column grid */
  lg?: ColSpanLg
  /** Large desktop (>= 1440px) — 12-column grid */
  xl?: ColSpanLg
  /** Extra-large desktop (>= 1536px) — 12-column grid */
  "2xl"?: ColSpanLg
  /** 3x-large desktop (>= 1920px) — 12-column grid */
  "3xl"?: ColSpanLg
  /** 4x-large desktop (>= 2560px) — 12-column grid */
  "4xl"?: ColSpanLg
}

interface CarouselItemProps extends React.ComponentProps<"div"> {
  /**
   * Number of PageGrid columns this item should span.
   * Responsive object or single value (mobile-first).
   *
   * The grid is 4 cols (sm), 8 cols (md), 12 cols (lg/xl/2xl/3xl/4xl).
   * Each breakpoint gets its own CSS selector so you can change the span
   * at any viewport width independently.
   *
   * @example
   * colSpan={2}                                       // 2 cols everywhere
   * colSpan={{ sm: 2, lg: 3 }}                       // 2 mobile, 3 desktop+
   * colSpan={{ sm: 2, md: 3, lg: 2, xl: 4, "2xl": 2 }}  // per breakpoint
   */
  colSpan?: ColSpanSm | ColSpanResponsive
}

function CarouselItem({ className, colSpan, ...props }: CarouselItemProps) {
  // Build data-col-span attributes from the typed prop.
  // Each breakpoint gets its own data attribute mapped to a dedicated
  // CSS media query selector in carousel-grid.css.
  const colSpanAttrs: Record<string, string> = {}
  if (colSpan !== undefined) {
    if (typeof colSpan === "number") {
      colSpanAttrs["data-col-span"] = String(colSpan)
    } else {
      colSpanAttrs["data-col-span"] = String(colSpan.sm)
      if (colSpan.md !== undefined) {
        colSpanAttrs["data-col-span-md"] = String(colSpan.md)
      }
      if (colSpan.lg !== undefined) {
        colSpanAttrs["data-col-span-lg"] = String(colSpan.lg)
      }
      if (colSpan.xl !== undefined) {
        colSpanAttrs["data-col-span-xl"] = String(colSpan.xl)
      }
      if (colSpan["2xl"] !== undefined) {
        colSpanAttrs["data-col-span-2xl"] = String(colSpan["2xl"])
      }
      if (colSpan["3xl"] !== undefined) {
        colSpanAttrs["data-col-span-3xl"] = String(colSpan["3xl"])
      }
      if (colSpan["4xl"] !== undefined) {
        colSpanAttrs["data-col-span-4xl"] = String(colSpan["4xl"])
      }
    }
  }

  return (
    <div
      role="group"
      aria-roledescription="slide"
      tabIndex={-1}
      data-slot="carousel-item"
      className={cn("min-w-0 shrink-0 grow-0 basis-auto snap-start", className)}
      {...props}
      {...colSpanAttrs}
    />
  )
}

// aria-haspopup="true" disables the Button's active:translate-y-px press animation.
// This is semantically incorrect but active:translate-y-0 cannot override the compound
// modifier (active:not-aria-[haspopup]:) via tailwind-merge.
function CarouselPrevious({
  className,
  variant = "secondary",
  size = "icon-sm",
  onClick,
  ...props
}: CarouselButtonProps) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  const positionClasses =
    orientation === "horizontal"
      ? "top-[calc(50%+var(--carousel-label-height,0px)/2)] left-0 -translate-x-1/2 -translate-y-1/2"
      : "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90"

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      aria-haspopup="true"
      className={cn(
        "absolute z-10 touch-manipulation rounded-full",
        // Hidden on tablet and below, hover-reveal on desktop
        "hidden lg:flex",
        "lg:opacity-0 lg:transition-opacity lg:duration-200",
        "lg:group-hover/carousel:opacity-100 lg:focus-visible:opacity-100",
        // Keep pointer events on disabled state so clicks don't pass through to items below
        "disabled:pointer-events-auto disabled:cursor-default",
        positionClasses,
        className
      )}
      disabled={!canScrollPrev}
      onClick={(e) => {
        scrollPrev()
        onClick?.(e)
      }}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
}

function CarouselNext({
  className,
  variant = "secondary",
  size = "icon-sm",
  onClick,
  ...props
}: CarouselButtonProps) {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  const positionClasses =
    orientation === "horizontal"
      ? "top-[calc(50%+var(--carousel-label-height,0px)/2)] right-0 -translate-y-1/2 translate-x-1/2"
      : "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-90"

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      aria-haspopup="true"
      className={cn(
        "absolute z-10 touch-manipulation rounded-full",
        // Hidden on tablet and below, hover-reveal on desktop
        "hidden lg:flex",
        "lg:opacity-0 lg:transition-opacity lg:duration-200",
        "lg:group-hover/carousel:opacity-100 lg:focus-visible:opacity-100",
        // Keep pointer events on disabled state so clicks don't pass through to items below
        "disabled:pointer-events-auto disabled:cursor-default",
        positionClasses,
        className
      )}
      disabled={!canScrollNext}
      onClick={(e) => {
        scrollNext()
        onClick?.(e)
      }}
      {...props}
    >
      <ChevronRightIcon />
      <span className="sr-only">Next slide</span>
    </Button>
  )
}

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  useCarousel,
}

export type {
  CarouselApi,
  CarouselContextProps,
  CarouselButtonProps,
  CarouselProps,
  CarouselContentProps,
  CarouselItemProps,
  CarouselOptions,
  CarouselPlugin,
  UseCarouselParameters,
}
