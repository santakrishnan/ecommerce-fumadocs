/// <reference types="@testing-library/jest-dom/vitest" />
import { Hotspot, HotspotContent, HotspotTrigger } from "@ucmp/ui"
import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils"
import { describe, expect, it } from "vitest"

describe("Hotspot", () => {
  it("renders the trigger button with aria-label", () => {
    render(
      <Hotspot>
        <HotspotTrigger aria-label="LED headlights" />
        <HotspotContent>LED headlights</HotspotContent>
      </Hotspot>
    )

    expect(
      screen.getByRole("button", { name: "LED headlights" })
    ).toBeInTheDocument()
  })

  it("applies position as inline styles on the wrapper", () => {
    render(
      <Hotspot>
        <HotspotTrigger aria-label="Feature" position={{ top: "40%", left: "60%" }} />
        <HotspotContent>Feature</HotspotContent>
      </Hotspot>
    )

    const wrapper = document.querySelector('[data-slot="hotspot-trigger-wrapper"]')
    expect(wrapper).toHaveStyle({ top: "40%", left: "60%" })
  })

  it("renders data-slot attributes on all elements", () => {
    render(
      <Hotspot>
        <HotspotTrigger aria-label="Feature" />
        <HotspotContent>Feature</HotspotContent>
      </Hotspot>
    )

    expect(document.querySelector('[data-slot="hotspot-trigger-wrapper"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="hotspot-trigger"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="hotspot-dot"]')).toBeInTheDocument()
  })

  it("opens popover content on click", async () => {
    const user = userEvent.setup()
    render(
      <Hotspot>
        <HotspotTrigger aria-label="Feature" />
        <HotspotContent>Alloy wheels</HotspotContent>
      </Hotspot>
    )

    await user.click(screen.getByRole("button", { name: "Feature" }))
    expect(screen.getByText("Alloy wheels")).toBeInTheDocument()
  })

  it("closes popover on Escape key", async () => {
    const user = userEvent.setup()
    render(
      <Hotspot>
        <HotspotTrigger aria-label="Feature" />
        <HotspotContent>Alloy wheels</HotspotContent>
      </Hotspot>
    )

    await user.click(screen.getByRole("button", { name: "Feature" }))
    expect(screen.getByText("Alloy wheels")).toBeInTheDocument()

    await user.keyboard("{Escape}")
    expect(screen.queryByText("Alloy wheels")).not.toBeInTheDocument()
  })

  it("accepts custom className on the trigger wrapper", () => {
    render(
      <Hotspot>
        <HotspotTrigger aria-label="Feature" className="custom-class" />
        <HotspotContent>Feature</HotspotContent>
      </Hotspot>
    )

    const wrapper = document.querySelector('[data-slot="hotspot-trigger-wrapper"]')
    expect(wrapper).toHaveClass("custom-class")
    expect(wrapper).toHaveClass("absolute")
  })

  it("uses the same visual state hooks for hover and selected state", () => {
    render(
      <Hotspot>
        <HotspotTrigger aria-label="Feature" />
        <HotspotContent>Feature</HotspotContent>
      </Hotspot>
    )

    const trigger = document.querySelector('[data-slot="hotspot-trigger"]')
    const dot = document.querySelector('[data-slot="hotspot-dot"]')

    expect(trigger).toHaveClass("hover:border-surface-primary")
    expect(trigger).toHaveClass("data-popup-open:border-surface-primary")
    expect(dot).toHaveClass("group-hover:scale-[0.667]")
    expect(dot).toHaveClass("group-data-popup-open:scale-[0.667]")
  })
})

describe("Hotspot - openOnHover", () => {
  it("opens popover content on hover", async () => {
    const user = userEvent.setup()
    render(
      <Hotspot>
        <HotspotTrigger aria-label="Feature" />
        <HotspotContent>Alloy wheels</HotspotContent>
      </Hotspot>
    )

    await user.hover(screen.getByRole("button", { name: "Feature" }))
    expect(await screen.findByText("Alloy wheels")).toBeInTheDocument()
  })

  it("closes popover content on unhover", async () => {
    const user = userEvent.setup()
    render(
      <Hotspot>
        <HotspotTrigger aria-label="Feature" />
        <HotspotContent>Alloy wheels</HotspotContent>
      </Hotspot>
    )

    await user.hover(screen.getByRole("button", { name: "Feature" }))
    expect(await screen.findByText("Alloy wheels")).toBeInTheDocument()

    await user.unhover(screen.getByRole("button", { name: "Feature" }))
    expect(screen.queryByText("Alloy wheels")).not.toBeInTheDocument()
  })
})
