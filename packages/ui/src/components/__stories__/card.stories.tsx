import type { Meta, StoryObj } from "@storybook/react"

import {
  Card,
  CardAction,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/card"
import { Button } from "@/components/button"

/**
 * Card — a static surface container rendered as a plain `<div>`.
 *
 * Use for non-interactive card surfaces. For cards that need to be a link or
 * button, use `InteractiveCard` instead (see Components/Card/InteractiveCard).
 *
 * Subcomponents: `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`,
 * `CardContent`, `CardFooter`.
 */
const meta = {
  title: "Components/Card",
  component: Card,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

/** Default card with all subcomponents. */
export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content — any layout you need.</p>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">Footer content</p>
      </CardFooter>
    </Card>
  ),
}

/** Card with a header action button (top-right). */
export const WithAction: Story = {
  name: "With Action",
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>You have 3 unread messages.</CardDescription>
        <CardAction>
          <Button size="sm" variant="secondary">
            Mark all read
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>The CardAction positions itself top-right of the header grid.</p>
      </CardContent>
    </Card>
  ),
}

/** Card with only header and content (no footer). */
export const HeaderAndContent: Story = {
  name: "Header + Content",
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Simple Card</CardTitle>
        <CardDescription>No footer needed for this layout.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Content sits below the header with default padding.</p>
      </CardContent>
    </Card>
  ),
}

/** Card with an image at the top — triggers the `has-[>img:first-child]:pt-0` rule. */
export const WithImage: Story = {
  name: "With Image",
  render: () => (
    <Card className="w-[350px]">
      <img
        src="https://placehold.co/350x180/1a1a1a/white?text=Card+Image"
        alt="Placeholder"
        className="h-[180px] w-full object-cover"
      />
      <CardHeader>
        <CardTitle>Image Card</CardTitle>
        <CardDescription>
          The image gets top border radius automatically via cardClasses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Content below the image.</p>
      </CardContent>
    </Card>
  ),
}

/** Card with custom className overrides. */
export const CustomStyling: Story = {
  name: "Custom Styling",
  render: () => (
    <Card className="w-[350px] border border-blue-200 bg-blue-50 shadow-md">
      <CardHeader>
        <CardTitle>Custom Styled</CardTitle>
        <CardDescription>
          Override card appearance via className. Base classes are merged with cn().
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Background, border, and shadow overridden.</p>
      </CardContent>
    </Card>
  ),
}

/** Minimal card — just content, no header or footer. */
export const Minimal: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardContent>
        <p className="text-center">A card with only content. No header, no footer.</p>
      </CardContent>
    </Card>
  ),
}
