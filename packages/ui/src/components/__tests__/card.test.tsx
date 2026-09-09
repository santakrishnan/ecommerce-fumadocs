/// <reference types="@testing-library/jest-dom/vitest" />
import { Card, PolyCard } from "@ucmp/ui"
import { render, screen } from "@ucmp/vitest-config/test-utils"
import { describe, expect, it, vi } from "vitest"

describe("Card", () => {
  it("renders as a div with data-slot='card'", () => {
    render(<Card>Content</Card>)
    const card = screen.getByText("Content")
    expect(card.tagName).toBe("DIV")
    expect(card).toHaveAttribute("data-slot", "card")
  })

  it("merges className with base card classes", () => {
    render(<Card className="custom-class">Content</Card>)
    const card = screen.getByText("Content")
    expect(card).toHaveClass("custom-class")
    expect(card).toHaveClass("group/card")
  })

  it("passes through additional HTML attributes", () => {
    render(<Card data-testid="my-card" id="card-1">Content</Card>)
    expect(screen.getByTestId("my-card")).toHaveAttribute("id", "card-1")
  })
})

describe("PolyCard", () => {
  it("renders as a div by default (no render prop)", () => {
    render(<PolyCard>Content</PolyCard>)
    const card = screen.getByText("Content")
    expect(card.tagName).toBe("DIV")
    expect(card).toHaveAttribute("data-slot", "card")
    expect(card).toHaveClass("group/card")
  })

  it("renders as a button via render prop", () => {
    render(
      <PolyCard render={<button type="button" aria-label="Click me" />}>
        Content
      </PolyCard>
    )
    const button = screen.getByRole("button", { name: "Click me" })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute("data-slot", "card")
    expect(button).toHaveTextContent("Content")
  })

  it("renders as a link via render prop", () => {
    render(
      <PolyCard render={<a href="/test" aria-label="Go to test" />}>
        Link content
      </PolyCard>
    )
    const link = screen.getByRole("link", { name: "Go to test" })
    expect(link).toHaveAttribute("href", "/test")
    expect(link).toHaveAttribute("data-slot", "card")
    expect(link).toHaveTextContent("Link content")
  })

  it("merges className onto the rendered element", () => {
    render(
      <PolyCard render={<button type="button" aria-label="test" />} className="custom-surface">
        Content
      </PolyCard>
    )
    const button = screen.getByRole("button", { name: "test" })
    expect(button).toHaveClass("custom-surface")
    expect(button).toHaveClass("group/card")
  })

  it("fires onClick on the rendered element", () => {
    const onClick = vi.fn()
    render(
      <PolyCard render={<button type="button" aria-label="test" onClick={onClick} />}>
        Content
      </PolyCard>
    )
    screen.getByRole("button", { name: "test" }).click()
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("does not render a wrapper div", () => {
    const { container } = render(
      <PolyCard render={<button type="button" aria-label="test" />}>
        Content
      </PolyCard>
    )
    // The button should be the direct child — no wrapper
    expect(container.firstElementChild?.tagName).toBe("BUTTON")
  })
})
