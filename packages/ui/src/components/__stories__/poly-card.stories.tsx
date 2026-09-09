import type { Meta, StoryObj } from "@storybook/react"

import {
  PolyCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/card"

/**
 * PolyCard — a minimal polymorphic card surface (just cardClasses + useRender).
 *
 * No wrapper, no adornments slot, no opinions about DOM structure.
 * Consumers compose their own patterns on top. These stories demonstrate
 * how an application would build the wrapper + adornment pattern externally.
 */
const meta = {
  title: "Components/Card/PolyCard",
  component: PolyCard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PolyCard>

export default meta
type Story = StoryObj<typeof meta>

/** PolyCard as a static div (default, same as Card). */
export const Default: Story = {
  render: () => (
    <PolyCard className="w-[350px]">
      <CardHeader>
        <CardTitle>Static PolyCard</CardTitle>
        <CardDescription>Renders as a div by default.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Same as Card when no render prop is passed.</p>
      </CardContent>
    </PolyCard>
  ),
}

/** PolyCard as a link — just the polymorphic surface, no wrapper. */
export const AsLink: Story = {
  name: "As Link (bare)",
  render: () => (
    <PolyCard
      className="w-[350px]"
      render={<a href="#" aria-label="Navigate to detail" />}
    >
      <CardHeader>
        <CardTitle>Link Card</CardTitle>
        <CardDescription>Entire card is an anchor. No wrapper div.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Click anywhere to navigate.</p>
      </CardContent>
    </PolyCard>
  ),
}

/** PolyCard as a button — bare, no wrapper. */
export const AsButton: Story = {
  name: "As Button (bare)",
  render: () => (
    <PolyCard
      className="w-[350px] text-left"
      render={
        <button
          type="button"
          aria-label="Select option"
          onClick={() => alert("clicked")}
        />
      }
    >
      <CardHeader>
        <CardTitle>Button Card</CardTitle>
        <CardDescription>Entire card is a button. No wrapper.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Click to trigger action.</p>
      </CardContent>
    </PolyCard>
  ),
}

/**
 * Consumer-composed wrapper + adornments pattern.
 *
 * This demonstrates how an application would build the InteractiveCard-like
 * structure externally using just PolyCard:
 * 1. A positioning wrapper div
 * 2. PolyCard as the interactive surface (link/button)
 * 3. Adornments as siblings with pointer-events
 */
export const ComposedWithAdornments: Story = {
  name: "Composed: Wrapper + Adornments",
  render: () => (
    <div className="relative w-fit rounded-xl">
      {/* The card surface — a link */}
      <PolyCard
        className="w-[350px]"
        render={<a href="#" aria-label="View product" />}
      >
        <CardHeader>
          <CardTitle>Product Card</CardTitle>
          <CardDescription>
            Wrapper + adornments composed at the application level.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>The save button below is a DOM sibling, not nested inside the link.</p>
        </CardContent>
      </PolyCard>

      {/* Adornments — positioned siblings with independent pointer events */}
      <div className="pointer-events-none absolute inset-0 z-20 [&>*]:pointer-events-auto">
        <button
          type="button"
          className="absolute top-3 right-3 rounded-full bg-white/90 p-2 shadow-sm hover:bg-white"
          onClick={(e) => {
            e.stopPropagation()
            alert("Save clicked — independent of card link")
          }}
        >
          ♡
        </button>
      </div>
    </div>
  ),
}

/** Consumer-composed with external sizing via wrapper. */
export const ComposedWithSizing: Story = {
  name: "Composed: External Sizing",
  render: () => (
    <div className="relative h-[200px] w-[300px] rounded-xl">
      <PolyCard
        className="h-full w-full"
        render={
          <button
            type="button"
            aria-label="Select"
            onClick={() => alert("clicked")}
          />
        }
      >
        <CardHeader>
          <CardTitle>Fixed Size</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Wrapper sets 300×200. PolyCard fills it with h-full w-full.
          </p>
        </CardContent>
      </PolyCard>
    </div>
  ),
}


