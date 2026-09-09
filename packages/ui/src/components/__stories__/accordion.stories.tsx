import type { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent, within } from "storybook/test"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/accordion"

/**
 * Accordion — a set of collapsible panels built on Base UI.
 *
 * By default only one panel can be open at a time (single-open behavior).
 * Pass the `multiple` prop to allow multiple panels open simultaneously.
 *
 * The component is style-agnostic — it inherits text color, background, and
 * font styles from its parent context. Consumers control visual appearance
 * via className overrides on the trigger and content.
 */
const meta = {
  title: "Components/Accordion",
  component: Accordion,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A set of collapsible panels built on [Base UI Accordion](https://base-ui.com/react/components/accordion#api-reference). " +
          "Original shadcn implementation: [shadcn/ui Accordion (Base)](https://ui.shadcn.com/docs/components/base/accordion).",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <div className="w-full max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

// --- Default (single open) ---

/** Default single-open behavior. Opening one item closes the previously open item. */
export const Default: Story = {
  render: () => (
    <Accordion defaultValue={["item-1"]}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Quick Links</AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2">
            <li>Build &amp; Price</li>
            <li>Find a Dealer</li>
            <li>Local Specials</li>
            <li>Request a Quote</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Toyota</AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2">
            <li>All Vehicles</li>
            <li>Concept Vehicles</li>
            <li>Toyota Safety Sense</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Useful Links</AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2">
            <li>Accessories</li>
            <li>Audio Multimedia</li>
            <li>Toyota Insurance</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // First item should be expanded by default
    const firstTrigger = canvas.getByRole("button", { name: "Quick Links" })
    await expect(firstTrigger).toHaveAttribute("aria-expanded", "true")

    // Click second item — it should open and first should close
    const secondTrigger = canvas.getByRole("button", { name: "Toyota" })
    await userEvent.click(secondTrigger)
    await expect(secondTrigger).toHaveAttribute("aria-expanded", "true")
    await expect(firstTrigger).toHaveAttribute("aria-expanded", "false")
  },
}

// --- Multiple open ---

/**
 * With the `multiple` prop, any number of panels can be open at the same time.
 * Use this for FAQ sections or content where users may want to compare items.
 */
export const MultipleOpen: Story = {
  render: () => (
    <Accordion multiple defaultValue={["item-1", "item-2"]}>
      <AccordionItem value="item-1">
        <AccordionTrigger>What is Base UI?</AccordionTrigger>
        <AccordionContent>
          <p>
            Base UI is a library of unstyled, accessible components for building
            custom design systems and web applications.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>How do I get started?</AccordionTrigger>
        <AccordionContent>
          <p>
            Install the package, import the components you need, and compose them
            with your own styles using Tailwind or CSS.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Can I use it for my project?</AccordionTrigger>
        <AccordionContent>
          <p>
            Yes — Base UI is MIT licensed and works with any React framework
            including Next.js, Remix, and Vite.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Both first and second should be expanded
    const firstTrigger = canvas.getByRole("button", { name: "What is Base UI?" })
    const secondTrigger = canvas.getByRole("button", { name: "How do I get started?" })
    await expect(firstTrigger).toHaveAttribute("aria-expanded", "true")
    await expect(secondTrigger).toHaveAttribute("aria-expanded", "true")

    // Opening third should NOT close the others
    const thirdTrigger = canvas.getByRole("button", { name: "Can I use it for my project?" })
    await userEvent.click(thirdTrigger)
    await expect(thirdTrigger).toHaveAttribute("aria-expanded", "true")
    await expect(firstTrigger).toHaveAttribute("aria-expanded", "true")
  },
}

// --- All collapsed ---

/** All items collapsed initially. User must click to expand. */
export const AllCollapsed: Story = {
  render: () => (
    <Accordion defaultValue={[]}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Section One</AccordionTrigger>
        <AccordionContent>
          <p>Content for section one.</p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Section Two</AccordionTrigger>
        <AccordionContent>
          <p>Content for section two.</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const firstTrigger = canvas.getByRole("button", { name: "Section One" })
    const secondTrigger = canvas.getByRole("button", { name: "Section Two" })
    await expect(firstTrigger).toHaveAttribute("aria-expanded", "false")
    await expect(secondTrigger).toHaveAttribute("aria-expanded", "false")
  },
}

// --- Disabled item ---

/** An individual item can be disabled, preventing interaction. */
export const DisabledItem: Story = {
  render: () => (
    <Accordion defaultValue={["item-1"]}>
      <AccordionItem value="item-1">
        <AccordionTrigger>Enabled Section</AccordionTrigger>
        <AccordionContent>
          <p>This section can be toggled.</p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem disabled value="item-2">
        <AccordionTrigger>Disabled Section</AccordionTrigger>
        <AccordionContent>
          <p>This content is not reachable.</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

// --- Custom trigger content ---

/**
 * The trigger accepts any ReactNode as children. Use this to compose
 * headers with badges, numbers, or mixed typography — the accordion
 * doesn't dictate font weight, size, or color.
 */
export const CustomTriggerContent: Story = {
  render: () => (
    <Accordion defaultValue={[]}>
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <span className="flex items-baseline gap-2">
            <span className="font-bold text-sm uppercase">Model</span>
            <span className="font-normal text-xs text-muted-foreground">3</span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2">
            <li>Camry</li>
            <li>Corolla</li>
            <li>RAV4</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          <span className="flex items-baseline gap-2">
            <span className="font-normal text-base">Payment Options</span>
            <span className="font-semibold text-xs text-primary">A</span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <p>Finance, lease, or cash purchase options available.</p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger className="text-base font-normal">
          Simple text trigger — no bold, larger size
        </AccordionTrigger>
        <AccordionContent>
          <p>The trigger className overrides the default font-semibold and text-sm.</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}

// --- Heading outside accordion ---

/**
 * Demonstrates the pattern where a heading sits outside the accordion
 * as a standalone element (e.g., "Local Dealers" in the mobile footer).
 * The heading is NOT part of the collapsible structure.
 */
export const HeadingOutsideAccordion: Story = {
  render: () => (
    <div>
      <h3 className="border-b border-border pb-4 font-semibold text-sm uppercase tracking-wide">
        Local Dealers
      </h3>
      <Accordion defaultValue={[]}>
        <AccordionItem value="find-dealer">
          <AccordionTrigger>Find a Dealer Near You</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2">
              <li>Parkway Toyota — 2.3 mi</li>
              <li>Bay Ridge Toyota — 4.1 mi</li>
              <li>Atlantic Toyota — 6.8 mi</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="services">
          <AccordionTrigger>Services</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2">
              <li>Schedule Service</li>
              <li>Order Parts</li>
              <li>Collision Center</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
}
