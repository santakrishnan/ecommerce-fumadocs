/// <reference types="@testing-library/jest-dom/vitest" />
import {
  Carousel,
  CarouselContent,
  CarouselGroup,
  CarouselGroupLabel,
  CarouselItem,
  useCarousel,
} from "@ucmp/ui"
import { fireEvent, render, screen } from "@ucmp/vitest-config/test-utils"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const emblaMock = {
  scrollTo: vi.fn(),
  scrollPrev: vi.fn(),
  scrollNext: vi.fn(),
  reInit: vi.fn(),
  distance: vi.fn(),
  useDuration: vi.fn(),
  useBaseDuration: vi.fn(),
  useBaseFriction: vi.fn(),
  targetSet: vi.fn(),
  animationStart: vi.fn(),
}

// Mutable engine state so tests can simulate where drag-free momentum is
// projected to land (`engineTarget`) and how far the track can scroll
// (`engineLimitMin`). Embla stores scroll offsets as negative numbers.
let engineTarget = 0
let engineLimitMin = -2000

function setEngineTarget(value: number) {
  engineTarget = value
}

function setEngineLimitMin(value: number) {
  engineLimitMin = value
}

let canScrollPrevValue = true
let canScrollNextValue = true

const emblaListeners = new Map<string, Set<(api: unknown) => void>>()

function emitEmblaEvent(event: string) {
  const callbacks = emblaListeners.get(event)
  if (!callbacks) return

  for (const callback of callbacks) {
    callback(mockApi)
  }
}

const mockApi = {
  containerNode: () => {
    return (
      document.querySelector('[data-slot="carousel-track"]') ??
      document.createElement("div")
    ) as HTMLElement
  },
  rootNode: () => {
    return (
      document.querySelector('[data-slot="carousel"]') ??
      document.createElement("div")
    ) as HTMLElement
  },
  canScrollPrev: () => canScrollPrevValue,
  canScrollNext: () => canScrollNextValue,
  scrollProgress: () => 0.5,
  selectedScrollSnap: () => 0,
  scrollTo: (index: number) => {
    emblaMock.scrollTo(index)
  },
  scrollPrev: () => {
    emblaMock.scrollPrev()
  },
  scrollNext: () => {
    emblaMock.scrollNext()
  },
  reInit: (...args: unknown[]) => {
    emblaMock.reInit(...args)
  },
  on: (event: string, callback: (api: unknown) => void) => {
    const callbacks = emblaListeners.get(event) ?? new Set<(api: unknown) => void>()
    callbacks.add(callback)
    emblaListeners.set(event, callbacks)
  },
  off: (event: string, callback: (api: unknown) => void) => {
    emblaListeners.get(event)?.delete(callback)
  },
  internalEngine: () => ({
    limit: { min: engineLimitMin },
    target: {
      get: () => engineTarget,
      set: (value: number) => {
        engineTarget = value
        emblaMock.targetSet(value)
      },
    },
    animation: {
      start: () => {
        emblaMock.animationStart()
      },
    },
    scrollBody: {
      useDuration: (duration: number) => {
        emblaMock.useDuration(duration)
      },
      useBaseDuration: () => {
        emblaMock.useBaseDuration()
      },
      useBaseFriction: () => {
        emblaMock.useBaseFriction()
      },
    },
    scrollTo: {
      distance: (distance: number, snap: boolean) => {
        emblaMock.distance(distance, snap)
      },
    },
    options: { axis: "x" },
  }),
}

vi.mock("embla-carousel-react", () => ({
  __esModule: true,
  default: () => [() => {}, mockApi],
}))
vi.mock("embla-carousel-wheel-gestures", () => ({
  WheelGesturesPlugin: () => ({}),
}))

beforeEach(() => {
  emblaListeners.clear()
  canScrollPrevValue = true
  canScrollNextValue = true
  emblaMock.scrollTo.mockReset()
  emblaMock.scrollPrev.mockReset()
  emblaMock.scrollNext.mockReset()
  emblaMock.reInit.mockReset()
  emblaMock.distance.mockReset()
  emblaMock.useDuration.mockReset()
  emblaMock.useBaseDuration.mockReset()
  emblaMock.useBaseFriction.mockReset()
  emblaMock.targetSet.mockReset()
  emblaMock.animationStart.mockReset()
  engineTarget = 0
  engineLimitMin = -2000
})

const originalResizeObserver = global.ResizeObserver
const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect

afterEach(() => {
  global.ResizeObserver = originalResizeObserver
  HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
})

function createDomRect(width: number): DOMRect {
  return {
    x: 0,
    y: 0,
    width,
    height: 0,
    top: 0,
    right: width,
    bottom: 0,
    left: 0,
    toJSON: () => ({}),
  } as DOMRect
}

function setupGridMeasurementMocks({
  colWidth,
  gap,
  itemWidth,
}: {
  colWidth: number
  gap: number
  itemWidth: number
}) {
  HTMLElement.prototype.getBoundingClientRect = function () {
    if (this.style.width === "var(--page-grid-col-width)") {
      return createDomRect(colWidth)
    }

    if (this.style.width === "var(--page-grid-gap)") {
      return createDomRect(gap)
    }

    if (this.getAttribute("data-slot") === "carousel-item") {
      return createDomRect(itemWidth)
    }

    return createDomRect(0)
  }
}

function setupResizeObserverMock() {
  const callbacks: ResizeObserverCallback[] = []

  class ResizeObserverMock {
    constructor(callback: ResizeObserverCallback) {
      callbacks.push(callback)
    }

    disconnect() {}

    observe() {}

    unobserve() {}
  }

  global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

  return {
    trigger() {
      for (const callback of callbacks) {
        callback([], {} as ResizeObserver)
      }
    },
  }
}

describe("CarouselGroup", () => {
  it('renders data-slot="carousel-group" attribute', () => {
    render(<CarouselGroup>content</CarouselGroup>)
    expect(
      document.querySelector('[data-slot="carousel-group"]')
    ).toBeInTheDocument()
  })

  it("applies flex-col and relative classes", () => {
    render(<CarouselGroup>content</CarouselGroup>)
    const group = document.querySelector('[data-slot="carousel-group"]')
    expect(group).toHaveClass("flex", "flex-col", "relative")
  })

  it("children render inside group", () => {
    render(
      <CarouselGroup>
        <span data-testid="child-1">Child 1</span>
        <span data-testid="child-2">Child 2</span>
      </CarouselGroup>
    )
    const group = document.querySelector('[data-slot="carousel-group"]')
    expect(group).toContainElement(screen.getByTestId("child-1"))
    expect(group).toContainElement(screen.getByTestId("child-2"))
  })

  it("accepts and applies className", () => {
    render(<CarouselGroup className="custom-class">content</CarouselGroup>)
    const group = document.querySelector('[data-slot="carousel-group"]')
    expect(group).toHaveClass("custom-class")
  })

  it("spreads additional HTML attributes (data-*, aria-*)", () => {
    render(
      <CarouselGroup data-testid="my-group" aria-label="Group label">
        content
      </CarouselGroup>
    )
    const group = screen.getByTestId("my-group")
    expect(group).toHaveAttribute("aria-label", "Group label")
    expect(group).toHaveAttribute("data-slot", "carousel-group")
  })

  it("works inside Carousel without errors", () => {
    render(
      <Carousel>
        <CarouselGroup>
          <span data-testid="nested-child">Nested</span>
        </CarouselGroup>
      </Carousel>
    )
    expect(screen.getByTestId("nested-child")).toBeInTheDocument()
    expect(
      document.querySelector('[data-slot="carousel-group"]')
    ).toBeInTheDocument()
  })
})

describe("CarouselGroup edge cases", () => {
  describe("single group renders correctly", () => {
    it("renders a single group with label and items without errors", () => {
      render(
        <Carousel>
          <CarouselGroup>
            <CarouselGroupLabel title="Only group" />
            <CarouselItem>Item 1</CarouselItem>
            <CarouselItem>Item 2</CarouselItem>
          </CarouselGroup>
        </Carousel>
      )
      const group = document.querySelector('[data-slot="carousel-group"]')
      expect(group).toBeInTheDocument()
      expect(screen.getByText("Only group")).toBeInTheDocument()
      expect(screen.getByText("Item 1")).toBeInTheDocument()
      expect(screen.getByText("Item 2")).toBeInTheDocument()
    })
  })

  describe("empty group (no items)", () => {
    it("renders gracefully without error when group has no children", () => {
      render(
        <Carousel>
          <CarouselGroup />
        </Carousel>
      )
      const group = document.querySelector('[data-slot="carousel-group"]')
      expect(group).toBeInTheDocument()
      const flexRow = group?.querySelector(".flex")
      expect(flexRow).toBeInTheDocument()
      expect(flexRow?.children.length).toBe(0)
    })
  })

  describe("group with label but no items", () => {
    it("renders label only above an empty flex row", () => {
      render(
        <Carousel>
          <CarouselGroup>
            <CarouselGroupLabel title="Empty section" />
          </CarouselGroup>
        </Carousel>
      )
      const group = document.querySelector('[data-slot="carousel-group"]')
      expect(group).toBeInTheDocument()

      const label = document.querySelector(
        '[data-slot="carousel-group-label"]'
      )
      expect(label).toBeInTheDocument()
      expect(label).toHaveTextContent("Empty section")

      const children = group?.children
      const lastChild = children?.[children.length - 1]
      expect(lastChild?.tagName).toBe("DIV")
      expect(lastChild?.children.length).toBe(0)
    })
  })

  describe("CarouselItem inside groups retains accessibility attributes", () => {
    it('has role="group" on CarouselItem within a group', () => {
      render(
        <Carousel>
          <CarouselGroup>
            <CarouselItem data-testid="grouped-item">Card</CarouselItem>
          </CarouselGroup>
        </Carousel>
      )
      const item = screen.getByTestId("grouped-item")
      expect(item).toHaveAttribute("role", "group")
    })

    it('has aria-roledescription="slide" on CarouselItem within a group', () => {
      render(
        <Carousel>
          <CarouselGroup>
            <CarouselItem data-testid="grouped-item">Card</CarouselItem>
          </CarouselGroup>
        </Carousel>
      )
      const item = screen.getByTestId("grouped-item")
      expect(item).toHaveAttribute("aria-roledescription", "slide")
    })

    it("has tabIndex={-1} on CarouselItem within a group", () => {
      render(
        <Carousel>
          <CarouselGroup>
            <CarouselItem data-testid="grouped-item">Card</CarouselItem>
          </CarouselGroup>
        </Carousel>
      )
      const item = screen.getByTestId("grouped-item")
      expect(item).toHaveAttribute("tabindex", "-1")
    })
  })
})

describe("CarouselGroup grid snap", () => {
  function renderGroup(options?: { disableGridSnap?: boolean }) {
    return render(
      <CarouselGroup disableGridSnap={options?.disableGridSnap}>
        <CarouselGroupLabel title="Group" subtitle="Subtitle" />
        <CarouselItem>Item 1</CarouselItem>
        <CarouselItem>Item 2</CarouselItem>
      </CarouselGroup>
    )
  }

  it("does not set min-width when label fits within items", () => {
    setupGridMeasurementMocks({ colWidth: 50, gap: 10, itemWidth: 100 })
    const observer = setupResizeObserverMock()

    renderGroup()

    const group = document.querySelector("[data-slot='carousel-group']") as HTMLDivElement
    const label = document.querySelector(
      "[data-slot='carousel-group-label']"
    ) as HTMLDivElement

    Object.defineProperty(label, "scrollWidth", {
      configurable: true,
      get: () => 180,
    })

    observer.trigger()

    expect(group.style.minWidth).toBe("")
  })

  it("sets snapped min-width when label overflows items", () => {
    setupGridMeasurementMocks({ colWidth: 50, gap: 10, itemWidth: 100 })
    const observer = setupResizeObserverMock()

    renderGroup()

    const group = document.querySelector("[data-slot='carousel-group']") as HTMLDivElement
    const label = document.querySelector(
      "[data-slot='carousel-group-label']"
    ) as HTMLDivElement

    Object.defineProperty(label, "scrollWidth", {
      configurable: true,
      get: () => 250,
    })

    observer.trigger()

    expect(group.style.minWidth).toBe("290px")
  })

  it("clears min-width when gap token resolves to NaN", () => {
    setupGridMeasurementMocks({ colWidth: 50, gap: 10, itemWidth: 100 })
    const observer = setupResizeObserverMock()

    renderGroup()

    const group = document.querySelector("[data-slot='carousel-group']") as HTMLDivElement
    const label = document.querySelector(
      "[data-slot='carousel-group-label']"
    ) as HTMLDivElement

    Object.defineProperty(label, "scrollWidth", {
      configurable: true,
      get: () => 250,
    })

    observer.trigger()
    expect(group.style.minWidth).toBe("290px")

    setupGridMeasurementMocks({ colWidth: 50, gap: Number.NaN, itemWidth: 100 })
    observer.trigger()

    expect(group.style.minWidth).toBe("")
  })

  it("does not set min-width when disableGridSnap is true", () => {
    setupGridMeasurementMocks({ colWidth: 50, gap: 10, itemWidth: 100 })
    const observer = setupResizeObserverMock()

    renderGroup({ disableGridSnap: true })

    const group = document.querySelector("[data-slot='carousel-group']") as HTMLDivElement
    const label = document.querySelector(
      "[data-slot='carousel-group-label']"
    ) as HTMLDivElement

    Object.defineProperty(label, "scrollWidth", {
      configurable: true,
      get: () => 250,
    })

    observer.trigger()

    expect(group.style.minWidth).toBe("")
  })

  it("removes min-width on cleanup", () => {
    setupGridMeasurementMocks({ colWidth: 50, gap: 10, itemWidth: 100 })
    const observer = setupResizeObserverMock()

    const { unmount } = renderGroup()

    const group = document.querySelector("[data-slot='carousel-group']") as HTMLDivElement
    const label = document.querySelector(
      "[data-slot='carousel-group-label']"
    ) as HTMLDivElement

    Object.defineProperty(label, "scrollWidth", {
      configurable: true,
      get: () => 250,
    })

    observer.trigger()
    expect(group.style.minWidth).toBe("290px")

    unmount()

    expect(group.style.minWidth).toBe("")
  })
})

// Test helper that exposes useCarousel() context values for inspection
function ContextInspector({
  onContext,
}: {
  onContext: (ctx: ReturnType<typeof useCarousel>) => void
}) {
  const context = useCarousel()
  onContext(context)
  return null
}

describe("stickyGroupLabels context wiring", () => {
  it("defaults to true when prop not provided", () => {
    let contextValue: ReturnType<typeof useCarousel> | undefined

    render(
      <Carousel>
        <ContextInspector
          onContext={(ctx) => {
            contextValue = ctx
          }}
        />
      </Carousel>
    )

    expect(contextValue).toBeDefined()
    expect(contextValue!.stickyGroupLabels).toBe(true)
  })

  it("passes false through context when explicitly disabled", () => {
    let contextValue: ReturnType<typeof useCarousel> | undefined

    render(
      <Carousel stickyGroupLabels={false}>
        <ContextInspector
          onContext={(ctx) => {
            contextValue = ctx
          }}
        />
      </Carousel>
    )

    expect(contextValue).toBeDefined()
    expect(contextValue!.stickyGroupLabels).toBe(false)
  })

  it("existing useCarousel fields remain unchanged", () => {
    let contextValue: ReturnType<typeof useCarousel> | undefined

    render(
      <Carousel stickyGroupLabels>
        <ContextInspector
          onContext={(ctx) => {
            contextValue = ctx
          }}
        />
      </Carousel>
    )

    expect(contextValue).toBeDefined()
    expect(contextValue!.carouselRef).toBeDefined()
    expect(contextValue!.scrollPrev).toBeTypeOf("function")
    expect(contextValue!.scrollNext).toBeTypeOf("function")
    expect(contextValue!.canScrollPrev).toBeTypeOf("boolean")
    expect(contextValue!.canScrollNext).toBeTypeOf("boolean")
    expect(contextValue!.orientation).toBe("horizontal")
    expect(contextValue!.opts).toBeDefined()
  })
})

describe("grouped keyboard navigation", () => {
  it("moves by item with arrow keys when grouped and scrollBySubitem is false", () => {
    render(
      <Carousel scrollBySubitem={false}>
        <CarouselContent>
          <CarouselGroup>
            <CarouselGroupLabel title="Group one" />
            <CarouselItem>Item 1</CarouselItem>
            <CarouselItem>Item 2</CarouselItem>
          </CarouselGroup>
          <CarouselGroup>
            <CarouselGroupLabel title="Group two" />
            <CarouselItem>Item 3</CarouselItem>
            <CarouselItem>Item 4</CarouselItem>
          </CarouselGroup>
        </CarouselContent>
      </Carousel>
    )

    // Mock getBoundingClientRect so focusItemAtIndex sees non-zero distances
    const root = screen.getByRole("region", { name: "carousel" })
    const items = root.querySelectorAll<HTMLElement>("[data-slot='carousel-item']")
    let offsetX = 0
    for (const item of items) {
      const left = offsetX
      item.getBoundingClientRect = () => ({
        left,
        top: 0,
        right: left + 200,
        bottom: 100,
        width: 200,
        height: 100,
        x: left,
        y: 0,
        toJSON: () => ({}),
      })
      offsetX += 200
    }
    root.getBoundingClientRect = () => ({
      left: 0, top: 0, right: 800, bottom: 100,
      width: 800, height: 100, x: 0, y: 0, toJSON: () => ({}),
    })

    fireEvent.keyDown(root, { key: "ArrowRight" })

    expect(emblaMock.distance).toHaveBeenCalled()
    expect(emblaMock.scrollTo).not.toHaveBeenCalled()
  })
})

describe("drag click suppression", () => {
  function renderCarouselWithButton(orientation: "horizontal" | "vertical" = "horizontal") {
    const onCardClick = vi.fn()

    render(
      <Carousel orientation={orientation}>
        <CarouselContent>
          <CarouselItem>
            <button onClick={onCardClick} type="button">
              Open card
            </button>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
    )

    const root = screen.getByRole("region", { name: "carousel" })
    const viewport = root.querySelector("[data-slot='carousel-content'] > div")
    const button = screen.getByRole("button", { name: "Open card" })

    if (!viewport) {
      throw new Error("Expected carousel viewport element to exist")
    }

    return { root, viewport, button, onCardClick }
  }

  it("blocks click after a real drag", () => {
    const { viewport, button, onCardClick } = renderCarouselWithButton()

    fireEvent.pointerDown(viewport, { clientX: 0, clientY: 0 })
    fireEvent.pointerMove(viewport, { clientX: 8, clientY: 0 })
    fireEvent.pointerUp(viewport)

    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true })
    const dispatchResult = button.dispatchEvent(clickEvent)

    expect(dispatchResult).toBe(false)
    expect(clickEvent.defaultPrevented).toBe(true)
    expect(onCardClick).not.toHaveBeenCalled()
  })

  it("allows click when there is no drag movement", () => {
    const { viewport, button, onCardClick } = renderCarouselWithButton()

    fireEvent.pointerDown(viewport, { clientX: 0, clientY: 0 })
    fireEvent.pointerUp(viewport)

    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true })
    const dispatchResult = button.dispatchEvent(clickEvent)

    expect(dispatchResult).toBe(true)
    expect(clickEvent.defaultPrevented).toBe(false)
    expect(onCardClick).toHaveBeenCalledTimes(1)
  })

  it("uses the 5px threshold boundary correctly", () => {
    const { viewport, button, onCardClick } = renderCarouselWithButton()

    // Boundary: 5px should not count as a drag.
    fireEvent.pointerDown(viewport, { clientX: 0, clientY: 0 })
    fireEvent.pointerMove(viewport, { clientX: 5, clientY: 0 })
    fireEvent.pointerUp(viewport)

    const clickAtBoundary = new MouseEvent("click", { bubbles: true, cancelable: true })
    const boundaryResult = button.dispatchEvent(clickAtBoundary)
    expect(boundaryResult).toBe(true)
    expect(clickAtBoundary.defaultPrevented).toBe(false)
    expect(onCardClick).toHaveBeenCalledTimes(1)

    // Over threshold: 6px should count as a drag and suppress click.
    fireEvent.pointerDown(viewport, { clientX: 0, clientY: 0 })
    fireEvent.pointerMove(viewport, { clientX: 6, clientY: 0 })
    fireEvent.pointerUp(viewport)

    const clickOverThreshold = new MouseEvent("click", { bubbles: true, cancelable: true })
    const overThresholdResult = button.dispatchEvent(clickOverThreshold)
    expect(overThresholdResult).toBe(false)
    expect(clickOverThreshold.defaultPrevented).toBe(true)
    expect(onCardClick).toHaveBeenCalledTimes(1)
  })

  it("ignores vertical jitter for horizontal carousels", () => {
    const { viewport, button, onCardClick } = renderCarouselWithButton("horizontal")

    fireEvent.pointerDown(viewport, { clientX: 0, clientY: 0 })
    fireEvent.pointerMove(viewport, { clientX: 0, clientY: 8 })
    fireEvent.pointerUp(viewport)

    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true })
    const dispatchResult = button.dispatchEvent(clickEvent)

    expect(dispatchResult).toBe(true)
    expect(clickEvent.defaultPrevented).toBe(false)
    expect(onCardClick).toHaveBeenCalledTimes(1)
  })

  it("ignores horizontal jitter for vertical carousels", () => {
    const { viewport, button, onCardClick } = renderCarouselWithButton("vertical")

    fireEvent.pointerDown(viewport, { clientX: 0, clientY: 0 })
    fireEvent.pointerMove(viewport, { clientX: 8, clientY: 0 })
    fireEvent.pointerUp(viewport)

    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true })
    const dispatchResult = button.dispatchEvent(clickEvent)

    expect(dispatchResult).toBe(true)
    expect(clickEvent.defaultPrevented).toBe(false)
    expect(onCardClick).toHaveBeenCalledTimes(1)
  })

  it("applies horizontal-only interaction classes on the viewport", () => {
    const { viewport } = renderCarouselWithButton("horizontal")
    expect(viewport).toBeInTheDocument()
    expect(viewport).toHaveClass("overflow-x-auto", "cursor-grab", "touch-pan-y")
    expect(viewport).not.toHaveClass("overflow-y-auto")
  })

  it("uses vertical overflow class without horizontal interaction classes", () => {
    const { viewport } = renderCarouselWithButton("vertical")
    expect(viewport).toBeInTheDocument()
    expect(viewport).toHaveClass("overflow-y-auto")
    expect(viewport).not.toHaveClass("overflow-x-auto", "cursor-grab", "touch-pan-y")
  })

  // Positions the carousel viewport and its items with fixed geometry so the
  // grid-snap math is deterministic. Viewport starts at x=0; items are 200px
  // wide starting at x=120 (i.e. left-aligned offsets of 120, 320, 520, 720).
  function mockCarouselGeometry(root: HTMLElement) {
    const items = root.querySelectorAll<HTMLElement>(
      "[data-slot='carousel-item']"
    )

    root.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 800,
      bottom: 100,
      width: 800,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    let left = 120
    for (const item of items) {
      const itemLeft = left
      item.getBoundingClientRect = () => ({
        left: itemLeft,
        top: 0,
        right: itemLeft + 200,
        bottom: 100,
        width: 200,
        height: 100,
        x: itemLeft,
        y: 0,
        toJSON: () => ({}),
      })
      left += 200
    }
  }

  it("redirects drag-free momentum to the nearest grid-aligned offset on release", () => {
    render(
      <Carousel scrollBySubitem>
        <CarouselContent>
          <CarouselGroup>
            <CarouselGroupLabel title="Group one" />
            <CarouselItem>Item 1</CarouselItem>
            <CarouselItem>Item 2</CarouselItem>
          </CarouselGroup>
          <CarouselGroup>
            <CarouselGroupLabel title="Group two" />
            <CarouselItem>Item 3</CarouselItem>
            <CarouselItem>Item 4</CarouselItem>
          </CarouselGroup>
        </CarouselContent>
      </Carousel>
    )

    const root = screen.getByRole("region", { name: "carousel" })
    mockCarouselGeometry(root)

    // Items sit at x = 120, 320, 520, 720, so relative to the first item their
    // aligned scroll offsets are 0, 200, 400, 600. Momentum is projected to land
    // at offset 180 (Embla stores it negated); the nearest aligned offset is 200,
    // so the track is redirected there and the existing glide is kept running.
    setEngineTarget(-180)
    emitEmblaEvent("pointerUp")

    expect(emblaMock.targetSet).toHaveBeenCalledTimes(1)
    expect(emblaMock.targetSet).toHaveBeenCalledWith(-200)
    expect(emblaMock.animationStart).toHaveBeenCalledTimes(1)
  })

  it("aligns the last card's right edge with the viewport at the end of the track", () => {
    render(
      <Carousel scrollBySubitem>
        <CarouselContent>
          <CarouselGroup>
            <CarouselGroupLabel title="Group one" />
            <CarouselItem>Item 1</CarouselItem>
            <CarouselItem>Item 2</CarouselItem>
          </CarouselGroup>
          <CarouselGroup>
            <CarouselGroupLabel title="Group two" />
            <CarouselItem>Item 3</CarouselItem>
            <CarouselItem>Item 4</CarouselItem>
          </CarouselGroup>
        </CarouselContent>
      </Carousel>
    )

    const root = screen.getByRole("region", { name: "carousel" })
    mockCarouselGeometry(root)

    // Aligned offsets relative to the first item are 0, 200, 400, 600.
    // Constrain the scrollable range so the last item can't be start-aligned:
    // maxScroll = 500, but start-aligning the last item would need 600.
    setEngineLimitMin(-500)
    // Momentum overshoots toward the end (projected offset 650).
    setEngineTarget(-650)
    emitEmblaEvent("pointerUp")

    // Clamped to maxScroll (500) — the track rests at its far edge, aligning
    // the last card's right edge with the viewport's right edge.
    expect(emblaMock.targetSet).toHaveBeenCalledWith(-500)
    expect(emblaMock.animationStart).toHaveBeenCalledTimes(1)
  })

  it("does not redirect momentum on release when dragFree is disabled", () => {
    render(
      <Carousel scrollBySubitem opts={{ align: "start", dragFree: false }}>
        <CarouselContent>
          <CarouselGroup>
            <CarouselGroupLabel title="Group one" />
            <CarouselItem>Item 1</CarouselItem>
            <CarouselItem>Item 2</CarouselItem>
          </CarouselGroup>
          <CarouselGroup>
            <CarouselGroupLabel title="Group two" />
            <CarouselItem>Item 3</CarouselItem>
            <CarouselItem>Item 4</CarouselItem>
          </CarouselGroup>
        </CarouselContent>
      </Carousel>
    )

    const root = screen.getByRole("region", { name: "carousel" })
    mockCarouselGeometry(root)

    setEngineTarget(-300)
    emitEmblaEvent("pointerUp")

    expect(emblaMock.targetSet).not.toHaveBeenCalled()
    expect(emblaMock.animationStart).not.toHaveBeenCalled()
  })

  it("does not redirect momentum on release when disableSnap is true", () => {
    render(
      <Carousel disableSnap scrollBySubitem>
        <CarouselContent>
          <CarouselGroup>
            <CarouselGroupLabel title="Group one" />
            <CarouselItem>Item 1</CarouselItem>
            <CarouselItem>Item 2</CarouselItem>
          </CarouselGroup>
          <CarouselGroup>
            <CarouselGroupLabel title="Group two" />
            <CarouselItem>Item 3</CarouselItem>
            <CarouselItem>Item 4</CarouselItem>
          </CarouselGroup>
        </CarouselContent>
      </Carousel>
    )

    const root = screen.getByRole("region", { name: "carousel" })
    mockCarouselGeometry(root)

    setEngineTarget(-180)
    emitEmblaEvent("pointerUp")

    expect(emblaMock.targetSet).not.toHaveBeenCalled()
    expect(emblaMock.animationStart).not.toHaveBeenCalled()
  })

  it("redirects momentum on release for a horizontal drag-free carousel with scrollBySubitem disabled", () => {
    render(
      <Carousel scrollBySubitem={false}>
        <CarouselContent>
          <CarouselItem>Item 1</CarouselItem>
          <CarouselItem>Item 2</CarouselItem>
          <CarouselItem>Item 3</CarouselItem>
          <CarouselItem>Item 4</CarouselItem>
        </CarouselContent>
      </Carousel>
    )

    const root = screen.getByRole("region", { name: "carousel" })
    mockCarouselGeometry(root)

    // Snapping is not tied to scrollBySubitem: any horizontal drag-free carousel
    // aligns on release. Aligned offsets are 0, 200, 400, 600; a projected
    // landing of 180 snaps to 200.
    setEngineTarget(-180)
    emitEmblaEvent("pointerUp")

    expect(emblaMock.targetSet).toHaveBeenCalledWith(-200)
    expect(emblaMock.animationStart).toHaveBeenCalledTimes(1)
  })

  it("keeps default dragFree (and snapping) when opts is a partial override", () => {
    render(
      // A partial opts must not clobber the default `dragFree: true`.
      <Carousel opts={{ align: "center" }}>
        <CarouselContent>
          <CarouselItem>Item 1</CarouselItem>
          <CarouselItem>Item 2</CarouselItem>
          <CarouselItem>Item 3</CarouselItem>
          <CarouselItem>Item 4</CarouselItem>
        </CarouselContent>
      </Carousel>
    )

    const root = screen.getByRole("region", { name: "carousel" })
    mockCarouselGeometry(root)

    setEngineTarget(-180)
    emitEmblaEvent("pointerUp")

    expect(emblaMock.targetSet).toHaveBeenCalledWith(-200)
    expect(emblaMock.animationStart).toHaveBeenCalledTimes(1)
  })

  it("does not redirect momentum for a vertical carousel", () => {
    render(
      <Carousel orientation="vertical">
        <CarouselContent>
          <CarouselItem>Item 1</CarouselItem>
          <CarouselItem>Item 2</CarouselItem>
          <CarouselItem>Item 3</CarouselItem>
          <CarouselItem>Item 4</CarouselItem>
        </CarouselContent>
      </Carousel>
    )

    const root = screen.getByRole("region", { name: "carousel" })
    mockCarouselGeometry(root)

    setEngineTarget(-180)
    emitEmblaEvent("pointerUp")

    expect(emblaMock.targetSet).not.toHaveBeenCalled()
    expect(emblaMock.animationStart).not.toHaveBeenCalled()
  })
})

describe("scrollBySubitem context wiring", () => {
  it("defaults to true when prop not provided", () => {
    let contextValue: ReturnType<typeof useCarousel> | undefined

    render(
      <Carousel>
        <ContextInspector
          onContext={(ctx) => {
            contextValue = ctx
          }}
        />
      </Carousel>
    )

    expect(contextValue).toBeDefined()
    expect(contextValue!.scrollBySubitem).toBe(true)
  })
})

describe("carousel arrow visibility", () => {
  function renderCarouselWithArrows() {
    render(
      <Carousel scrollBySubitem={false}>
        <CarouselContent>
          <CarouselItem>Item 1</CarouselItem>
          <CarouselItem>Item 2</CarouselItem>
          <CarouselItem>Item 3</CarouselItem>
        </CarouselContent>
      </Carousel>
    )
  }

  it("hides only the previous button when scroll prev is disabled", () => {
    canScrollPrevValue = false
    canScrollNextValue = true

    renderCarouselWithArrows()

    expect(
      screen.queryByRole("button", { name: "Previous slide" })
    ).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Next slide" })).toBeInTheDocument()
  })

  it("hides only the next button when scroll next is disabled", () => {
    canScrollPrevValue = true
    canScrollNextValue = false

    renderCarouselWithArrows()

    expect(
      screen.getByRole("button", { name: "Previous slide" })
    ).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Next slide" })).not.toBeInTheDocument()
  })
})

