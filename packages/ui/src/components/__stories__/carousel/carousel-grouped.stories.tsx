import type { Meta, StoryObj } from "@storybook/react"

import {
  Carousel,
  CarouselContent,
  CarouselGroup,
  CarouselGroupLabel,
  CarouselItem,
} from "@/components/carousel"
import {
  PolyCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/card"

const meta = {
  title: "Components/Carousel/Grouped",
  component: Carousel,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "CarouselGroup is supported in horizontal orientation only. Vertical orientation is not supported for CarouselGroup.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal"],
      description:
        "CarouselGroup is horizontal-only. Vertical orientation is not supported for grouped carousels.",
    },
    stickyGroupLabels: {
      control: "boolean",
      description:
        "When true, group labels pin at the left edge of the carousel viewport during horizontal scroll, yielding to the next group's label at the group boundary. Horizontal grouped carousels only. Defaults to true.",
    },
    scrollBySubitem: {
      control: "boolean",
      description:
        "When true, arrow buttons and keyboard navigation scroll one individual CarouselItem at a time instead of one slide/group at a time. Horizontal grouped carousels only. Defaults to true.",
    },
    disableSnap: {
      control: "boolean",
      description:
        "Disable grid-snap-on-release for horizontal drag-free carousels. When true, the track rests wherever momentum stops instead of aligning the nearest item to the start edge.",
    },
  },
  args: {
    orientation: "horizontal",
    stickyGroupLabels: true,
    scrollBySubitem: true,
    disableSnap: false,
  },
} satisfies Meta<typeof Carousel>

export default meta
type Story = StoryObj<typeof meta>

function PlaceholderCard({ label }: { label: string }) {
  return (
    <div className="flex h-32 w-48 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground">
      {label}
    </div>
  )
}

/**
 * Multiple groups with labels scrolling naturally (sticky explicitly disabled).
 * Each group has a title and several placeholder cards.
 */
export const GroupedSections: Story = {
  args: {
    stickyGroupLabels: false,
  },
  render: (args) => (
    <div className="mx-auto max-w-3xl px-12">
      <Carousel {...args}>
        <CarouselContent>
          <CarouselGroup>
            <CarouselGroupLabel title="Recently Viewed" />
            <CarouselItem>
              <PlaceholderCard label="Card 1" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card 2" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card 3" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card 4" />
            </CarouselItem>
          </CarouselGroup>
          <CarouselGroup>
            <CarouselGroupLabel title="Recommended" />
            <CarouselItem>
              <PlaceholderCard label="Card A" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card B" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card C" />
            </CarouselItem>
          </CarouselGroup>
          <CarouselGroup>
            <CarouselGroupLabel title="Trending" />
            <CarouselItem>
              <PlaceholderCard label="Card X" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card Y" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card Z" />
            </CarouselItem>
          </CarouselGroup>
        </CarouselContent>
      </Carousel>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Multiple groups with labels scrolling naturally. Sticky behavior is explicitly disabled via `stickyGroupLabels={false}` (the default is now true). Scroll or drag to see all groups and their items.",
      },
    },
  },
}

/**
 * Grouped sections with `disableSnap` — free scrolling, no snap-to-item on release.
 */
export const GroupedNoSnap: Story = {
  args: {
    disableSnap: true,
  },
  render: (args) => (
    <div className="mx-auto max-w-3xl px-12">
      <Carousel {...args}>
        <CarouselContent>
          <CarouselGroup>
            <CarouselGroupLabel title="Recently Viewed" />
            <CarouselItem>
              <PlaceholderCard label="Card 1" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card 2" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card 3" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card 4" />
            </CarouselItem>
          </CarouselGroup>
          <CarouselGroup>
            <CarouselGroupLabel title="Recommended" />
            <CarouselItem>
              <PlaceholderCard label="Card A" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card B" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card C" />
            </CarouselItem>
          </CarouselGroup>
        </CarouselContent>
      </Carousel>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates `disableSnap={true}` on a grouped carousel. Drag or flick and release — the track glides to a free resting position rather than aligning the nearest item to the start edge.",
      },
    },
  },
}

/**
 * Same layout with `stickyGroupLabels` enabled.
 * Labels pin at the left edge of the viewport during scroll and yield to the next group's label.
 */
export const GroupedSectionsSticky: Story = {
  args: {
    stickyGroupLabels: true,
  },
  render: (args) => (
    <div className="mx-auto max-w-3xl px-12">
      <Carousel {...args}>
        <CarouselContent>
          <CarouselGroup>
            <CarouselGroupLabel title="Recently Viewed" />
            <CarouselItem>
              <PlaceholderCard label="Card 1" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card 2" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card 3" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card 4" />
            </CarouselItem>
          </CarouselGroup>
          <CarouselGroup>
            <CarouselGroupLabel title="Recommended" />
            <CarouselItem>
              <PlaceholderCard label="Card A" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card B" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card C" />
            </CarouselItem>
          </CarouselGroup>
          <CarouselGroup>
            <CarouselGroupLabel title="Trending" />
            <CarouselItem>
              <PlaceholderCard label="Card X" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card Y" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card Z" />
            </CarouselItem>
          </CarouselGroup>
        </CarouselContent>
      </Carousel>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Sticky labels enabled. Scroll horizontally to see each group's label pin at the left edge, then yield when the next group arrives.",
      },
    },
  },
}

/**
 * A group with both title and subtitle on the label.
 * Demonstrates the subtitle prop rendering below the title.
 */
export const GroupedWithSubtitle: Story = {
  args: {
    stickyGroupLabels: false,
  },
  render: (args) => (
    <div className="mx-auto max-w-3xl px-12">
      <Carousel {...args}>
        <CarouselContent>
          <CarouselGroup>
            <CarouselGroupLabel
              title="More Matches"
              subtitle="Based on your search"
            />
            <CarouselItem>
              <PlaceholderCard label="Card 1" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card 2" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card 3" />
            </CarouselItem>
          </CarouselGroup>
          <CarouselGroup>
            <CarouselGroupLabel title="Continue Shopping" />
            <CarouselItem>
              <PlaceholderCard label="Card A" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card B" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card C" />
            </CarouselItem>
          </CarouselGroup>
        </CarouselContent>
      </Carousel>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates a group label with both title and subtitle. The subtitle renders below the title in smaller, muted text.",
      },
    },
  },
}

/**
 * Single group edge case.
 * Only one group with items — demonstrates that the component works correctly without multiple groups.
 */
export const GroupedSingleGroup: Story = {
  args: {
    stickyGroupLabels: false,
  },
  render: (args) => (
    <div className="mx-auto max-w-3xl px-12">
      <Carousel {...args}>
        <CarouselContent>
          <CarouselGroup>
            <CarouselGroupLabel title="Featured Items" />
            <CarouselItem>
              <PlaceholderCard label="Card 1" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card 2" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card 3" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card 4" />
            </CarouselItem>
            <CarouselItem>
              <PlaceholderCard label="Card 5" />
            </CarouselItem>
          </CarouselGroup>
        </CarouselContent>
      </Carousel>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Single group with one label and several items. Verifies the component handles the single-group edge case without issues.",
      },
    },
  },
}

/**
 * Grouped carousel with data-carousel-focus targets.
 *
 * Arrow keys focus the marked link in each card instead of the CarouselItem
 * wrapper, matching the same keyboard behavior shown in the base
 * "With data-carousel-focus" story.
 */
export const GroupedWithFocusTarget: Story = {
  name: "Grouped with data-carousel-focus",
  args: {
    stickyGroupLabels: true,
    hoverScaleRatio: 1.05
  },
  render: (args) => {
    const cards = [
      { title: "Card One", href: "#grouped-one", group: "Recently Viewed" },
      { title: "Card Two", href: "#grouped-two", group: "Recently Viewed" },
      { title: "Card Five", href: "#grouped-five", group: "Recently Viewed" },
      { title: "Card Three", href: "#grouped-three", group: "Recommended" },
      { title: "Card Four", href: "#grouped-four", group: "Recommended" },
      { title: "Card Six", href: "#grouped-six", group: "Recommended" },
    ]

    const recent = cards.filter((card) => card.group === "Recently Viewed")
    const recommended = cards.filter((card) => card.group === "Recommended")

    return (
      <div className="mx-auto max-w-3xl px-12">
        <Carousel {...args} opts={{ align: "start" }}>
          <CarouselContent>
            <CarouselGroup>
              <CarouselGroupLabel title="Recently Viewed" />
              {recent.map((card) => (
                  <CarouselItem key={card.href} className="w-48">
                  <PolyCard
                    render={
                      <a href={card.href} aria-label={card.title} data-carousel-focus />
                    }
                  >
                    <CardHeader>
                      <CardTitle>{card.title}</CardTitle>
                      <CardDescription>
                        Arrow keys focus this link via data-carousel-focus.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Tab to carousel, then use left/right arrows to move focus.
                      </p>
                    </CardContent>
                  </PolyCard>
                </CarouselItem>
              ))}
            </CarouselGroup>

            <CarouselGroup>
              <CarouselGroupLabel title="Recommended" />
              {recommended.map((card) => (
                  <CarouselItem key={card.href} className="w-48">
                  <PolyCard
                    render={
                      <a href={card.href} aria-label={card.title} data-carousel-focus />
                    }
                  >
                    <CardHeader>
                      <CardTitle>{card.title}</CardTitle>
                      <CardDescription>
                        Arrow keys focus this link via data-carousel-focus.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Tab to carousel, then use left/right arrows to move focus.
                      </p>
                    </CardContent>
                  </PolyCard>
                </CarouselItem>
              ))}
            </CarouselGroup>
          </CarouselContent>
        </Carousel>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          "Grouped carousel variant of data-carousel-focus. Add data-carousel-focus to an inner interactive element to make it the arrow-key focus target, with sticky group labels enabled.",
      },
    },
  },
}
