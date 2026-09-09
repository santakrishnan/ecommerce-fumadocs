import type { UseEmblaCarouselType } from "embla-carousel-react"

type CarouselApi = UseEmblaCarouselType[1]

/**
 * Reads Embla's current translated X offset from the container transform.
 * Returns 0 when the API is unavailable or no transform has been applied.
 */
function getCurrentScrollOffset(api: CarouselApi | undefined): number {
  if (!api) return 0
  const containerNode = api.containerNode()
  const transform = getComputedStyle(containerNode).transform
  if (!transform || transform === "none") return 0
  const match = transform.match(/matrix.*\((.+)\)/)
  if (!match?.[1]) return 0
  const values = match[1].split(",").map(Number)
  const tx = values.length === 6 ? values[4] : values[12]
  return -(tx ?? 0)
}

/**
 * Detects grouped horizontal tracks where each direct container child is a
 * `carousel-group` element.
 */
function isGroupedHorizontalTrack(
  api: CarouselApi | undefined,
  orientation: "horizontal" | "vertical"
): boolean {
  if (!api || orientation !== "horizontal") return false

  const directChildren = Array.from(api.containerNode().children)
  if (directChildren.length === 0) return false

  return directChildren.every(
    (child) => (child as HTMLElement).dataset.slot === "carousel-group"
  )
}

/**
 * Finds the item whose left edge is closest to the viewport's left edge.
 * Used as the fallback keyboard anchor in grouped layouts.
 */
function getNearestItemIndexFromViewportStart(
  api: CarouselApi | undefined,
  items: NodeListOf<HTMLElement>
): number {
  if (!api || items.length === 0) return 0

  const viewportLeft = api.rootNode().getBoundingClientRect().left
  let nearestIndex = 0
  let nearestDistance = Number.POSITIVE_INFINITY

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item) continue
    const distance = Math.abs(item.getBoundingClientRect().left - viewportLeft)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestIndex = i
    }
  }

  return nearestIndex
}

/**
 * Reads the scroll offset (positive px) where drag-free momentum is projected
 * to come to rest.
 *
 * On pointer or wheel release, Embla sets its internal `target` vector to the
 * momentum landing position (release location + flick force). Converting that
 * to a positive scroll offset lets us decide where the track *would* stop so we
 * can redirect it onto the grid before the glide finishes.
 */
function getProjectedScrollOffset(api: CarouselApi | undefined): number {
  if (!api) return 0
  return -api.internalEngine().target.get()
}

/**
 * Computes the scroll offset (positive px) at which the track should rest so a
 * single item aligns with the carousel's resting start edge.
 *
 * Anchor: use the first item's current left edge as a baseline and measure every
 * item relative to it. Because item-to-item deltas are invariant under the track
 * transform, these offsets are scroll-position independent and preserve any
 * leading track padding present at the resting start.
 *
 * Selection rule: among all items, pick the one whose aligned rest offset is
 * closest to `projectedScrollOffset` (where drag-free momentum is heading).
 * This aligns the card that momentum leaves nearest the start edge.
 *
 * End rule: every candidate offset is clamped to `[0, maxScroll]`. When the
 * chosen item sits too close to the end to be start-aligned, clamping to
 * `maxScroll` instead rests the track at its far edge — which aligns the last
 * item's right edge with the viewport's right edge.
 *
 * Returns null when alignment can't be computed (no API or no items).
 */
function getAlignedSnapOffset(
  api: CarouselApi | undefined,
  projectedScrollOffset: number
): number | null {
  if (!api) return null

  const items = api.rootNode().querySelectorAll<HTMLElement>(
    "[data-slot='carousel-item']"
  )
  const firstItem = items[0]
  if (!firstItem) return null

  // Left edge of the first item = the track's resting start position.
  const trackStart = firstItem.getBoundingClientRect().left
  const maxScroll = Math.max(0, -api.internalEngine().limit.min)

  let bestOffset: number | null = null
  let bestDistance = Number.POSITIVE_INFINITY

  for (const item of items) {
    // Distance from the resting start = the scroll offset that aligns this item
    // to the start edge. Item-to-item deltas are scroll-position invariant, so
    // this needs no live transform read.
    const alignedScroll = item.getBoundingClientRect().left - trackStart
    const clamped = Math.max(0, Math.min(alignedScroll, maxScroll))

    const distance = Math.abs(clamped - projectedScrollOffset)
    if (distance < bestDistance) {
      bestDistance = distance
      bestOffset = clamped
    }
  }

  return bestOffset
}

/**
 * Returns the index of the carousel item that currently contains focus.
 * Returns -1 if no item contains the active element.
 */
function getFocusedItemIndex(
  items: NodeListOf<HTMLElement>,
  activeElement: Element | null
): number {
  if (!activeElement) return -1

  for (let i = 0; i < items.length; i++) {
    if (items[i]?.contains(activeElement)) {
      return i
    }
  }

  return -1
}

/**
 * Scrolls one item width forward or backward in sub-item mode.
 * Returns false when there are not enough items to compute a step distance.
 */
function scrollBySubitemStep(
  api: CarouselApi | undefined,
  direction: "prev" | "next"
): boolean {
  if (!api) return false

  const rootNode = api.rootNode()
  const items = rootNode.querySelectorAll<HTMLElement>(
    "[data-slot='carousel-item']"
  )
  const firstItem = items[0]
  const secondItem = items[1]
  if (!firstItem || !secondItem) return false

  const itemWidth =
    secondItem.getBoundingClientRect().left -
    firstItem.getBoundingClientRect().left

  const engine = api.internalEngine()
  engine.scrollBody.useBaseDuration()
  const signedDistance = direction === "prev" ? itemWidth : -itemWidth
  engine.scrollTo.distance(signedDistance, false)

  return true
}

export {
  getAlignedSnapOffset,
  getCurrentScrollOffset,
  getFocusedItemIndex,
  getNearestItemIndexFromViewportStart,
  getProjectedScrollOffset,
  isGroupedHorizontalTrack,
  scrollBySubitemStep,
}

export type { CarouselApi }
