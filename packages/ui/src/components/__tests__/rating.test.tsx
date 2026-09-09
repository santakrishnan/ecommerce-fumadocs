/// <reference types="@testing-library/jest-dom/vitest" />
import { Rating } from "@ucmp/ui"
import { render, screen } from "@ucmp/vitest-config/test-utils"
import { describe, expect, it } from "vitest"

describe("Rating", () => {
  it("renders the correct number of rating items for default max", () => {
    render(<Rating value={3} />)
    const items = document.querySelectorAll('[data-slot="rating-item"]')
    expect(items).toHaveLength(5)
  })

  it("renders the correct number of rating items for custom max", () => {
    render(<Rating value={7} max={10} />)
    const items = document.querySelectorAll('[data-slot="rating-item"]')
    expect(items).toHaveLength(10)
  })

  it("has role=img on the root element", () => {
    render(<Rating value={3} />)
    expect(screen.getByRole("img")).toBeInTheDocument()
  })

  it("generates a default aria-label with value and max", () => {
    render(<Rating value={3.5} />)
    expect(screen.getByRole("img")).toHaveAccessibleName("3.5 out of 5 stars")
  })

  it("rounds value to the nearest precision increment for aria-label", () => {
    render(<Rating value={3.7} precision={0.25} />)
    expect(screen.getByRole("img")).toHaveAccessibleName("3.75 out of 5 stars")
  })

  it("accepts a custom aria-label", () => {
    render(<Rating value={4} aria-label="4 out of 5" />)
    expect(screen.getByRole("img")).toHaveAccessibleName("4 out of 5")
  })

  it("root element is not focusable", () => {
    render(<Rating value={3} />)
    const root = screen.getByRole("img")
    expect(root.tagName.toLowerCase()).toBe("span")
    expect(root).not.toHaveAttribute("tabindex")
  })

  it("clamps value to max", () => {
    render(<Rating value={10} max={5} />)
    expect(screen.getByRole("img")).toHaveAccessibleName("5 out of 5 stars")
  })

  it("clamps value to 0 when negative", () => {
    render(<Rating value={-1} max={5} />)
    expect(screen.getByRole("img")).toHaveAccessibleName("0 out of 5 stars")
  })

  it("renders data-slot=rating on root", () => {
    render(<Rating value={2} />)
    expect(document.querySelector('[data-slot="rating"]')).toBeInTheDocument()
  })

  it("applies additional className to root", () => {
    render(<Rating value={2} className="custom-class" />)
    expect(document.querySelector('[data-slot="rating"]')).toHaveClass("custom-class")
  })

  it("renders no fill overlays when value is 0", () => {
    render(<Rating value={0} />)
    const items = document.querySelectorAll('[data-slot="rating-item"]')
    expect(items).toHaveLength(5)
    for (const item of items) {
      expect(item.children).toHaveLength(1)
    }
  })

  it("renders a fill overlay span for each filled or partial star", () => {
    render(<Rating value={3} />)
    const items = document.querySelectorAll('[data-slot="rating-item"]')
    let filledCount = 0
    for (const item of items) {
      if (item.children.length > 1) filledCount++
    }
    expect(filledCount).toBe(3)
  })

  it("partial star has fill overlay with less than 100% width", () => {
    render(<Rating value={3.5} />)
    const items = document.querySelectorAll('[data-slot="rating-item"]')
    const fourthItem = items[3]
    const overlay = fourthItem?.children[1] as HTMLElement | undefined
    expect(overlay).toBeDefined()
    expect(overlay?.style.width).toBe("50%")
  })

  it("full star has fill overlay at 100% width", () => {
    render(<Rating value={3.5} />)
    const items = document.querySelectorAll('[data-slot="rating-item"]')
    const firstItem = items[0]
    const overlay = firstItem?.children[1] as HTMLElement | undefined
    expect(overlay).toBeDefined()
    expect(overlay?.style.width).toBe("100%")
  })

  it("precision greater than 1 rounds to nearest multi-star increment", () => {
    render(<Rating value={3} max={5} precision={2} />)
    expect(screen.getByRole("img")).toHaveAccessibleName("4 out of 5 stars")
    const items = document.querySelectorAll('[data-slot="rating-item"]')
    let filledCount = 0
    for (const item of items) {
      if (item.children.length > 1) filledCount++
    }
    expect(filledCount).toBe(4)
  })

  it("clamps precision to max so it cannot exceed the scale", () => {
    render(<Rating value={3} max={5} precision={10} />)
    const label = screen.getByRole("img").getAttribute("aria-label")
    const rounded = Number(label?.split(" ")[0])
    expect(rounded).toBeGreaterThanOrEqual(0)
    expect(rounded).toBeLessThanOrEqual(5)
  })

  it("accepts custom icon and emptyIcon elements", () => {
    const customIcon = <span data-testid="custom-filled">★</span>
    const customEmpty = <span data-testid="custom-empty">☆</span>
    render(<Rating value={2} icon={customIcon} emptyIcon={customEmpty} />)
    expect(screen.getAllByTestId("custom-empty")).toHaveLength(5)
    expect(screen.getAllByTestId("custom-filled")).toHaveLength(2)
  })
})
