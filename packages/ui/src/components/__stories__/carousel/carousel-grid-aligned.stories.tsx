import type { Meta, StoryObj } from "@storybook/react"

import {
  Carousel,
  CarouselContent,
  CarouselGroup,
  CarouselGroupLabel,
  CarouselItem,
} from "@/components/carousel"
import { PageGrid } from "@/components/page-grid"
import { cn } from "@/lib/utils"

const meta = {
  title: "Components/Carousel/Grid Aligned",
  component: Carousel,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "Demonstrates carousel items and groups aligned to the PageGrid column system using the typed `colSpan` prop.",
          "",
          "**How it works:** Items compute their width from `--page-grid-col-width` (defined in `grid.css`), which derives from `100vw`, the grid margin, gap, and column count. For alignment to work correctly, the carousel must use the standard bleed pattern (`-mx-5 pl-5 lg:-mx-10 lg:pl-10`) inside a PageGrid — exactly as the real app does.",
          "",
          "**NOTE: View these stories in the Canvas tab (not Docs)** at full width for accurate alignment.",
        ].join("\n"),
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    stickyGroupLabels: {
      control: "boolean",
      description: "Enable sticky group label pinning during scroll. Defaults to true.",
    },
    scrollBySubitem: {
      control: "boolean",
      description:
        "Scroll one item at a time instead of one group at a time. Defaults to true.",
    },
    disableSnap: {
      control: "boolean",
      description:
        "Disable grid-snap-on-release. When true, the track rests wherever momentum stops instead of aligning the nearest item to the grid.",
    },
  },
  args: {
    stickyGroupLabels: true,
    scrollBySubitem: true,
    disableSnap: false,
  },
} satisfies Meta<typeof Carousel>

export default meta
type Story = StoryObj<typeof meta>

/** Visual placeholder card that fills its parent's width */
function GridCard({
  label,
  span,
  className,
}: {
  label: string
  span: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex aspect-[4/3] w-full flex-col items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-center",
        className
      )}
    >
      <span className="text-base font-semibold text-neutral-800">{label}</span>
      <span className="mt-2 text-sm text-neutral-500">span: {span}</span>
    </div>
  )
}

/**
 * Grid overlay rendered as an absolutely positioned PageGrid to visualize
 * column boundaries without affecting layout.
 */
function GridOverlay() {
  return (
    <PageGrid className="pointer-events-none absolute inset-0 z-0 h-full" maxWidth="xl">
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-full rounded-sm bg-red-500/10",
            i >= 4 && i < 8 && "hidden md:block",
            i >= 8 && "hidden lg:block"
          )}
        />
      ))}
    </PageGrid>
  )
}

/**
 * Carousel items aligned to 2-column spans using the typed `colSpan` prop.
 */
export const ItemsSpan2: Story = {
  render: (args) => (
    <div className="relative py-10">
      <GridOverlay />
      <PageGrid maxWidth="xl">
        <div className="col-span-full relative z-10">
          <Carousel {...args} >
            <CarouselContent>
              {Array.from({ length: 8 }, (_, i) => (
                <CarouselItem key={i} colSpan={2}>
                  <GridCard label={`Card ${i + 1}`} span="2" />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </PageGrid>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Each CarouselItem uses `colSpan={2}` to size itself to exactly 2 PageGrid columns. The red overlay shows column boundaries — card edges should align with column edges.",
      },
    },
  },
}

/**
 * Grid-aligned items with `disableSnap` — free scrolling that ignores the grid on release.
 */
export const ItemsSpan2NoSnap: Story = {
  args: {
    disableSnap: true,
  },
  render: (args) => (
    <div className="relative py-10">
      <GridOverlay />
      <PageGrid maxWidth="xl">
        <div className="col-span-full relative z-10">
          <Carousel {...args}>
            <CarouselContent>
              {Array.from({ length: 8 }, (_, i) => (
                <CarouselItem key={i} colSpan={2}>
                  <GridCard label={`Card ${i + 1}`} span="2" />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </PageGrid>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Same 2-column items as ItemsSpan2 but with `disableSnap={true}`. On release the track rests wherever momentum stops, so card edges will typically NOT line up with the column overlay. Toggle `disableSnap` off in the controls to see edges snap back to the grid.",
      },
    },
  },
}

/**
 * Responsive grid spans: 2 cols on mobile, 3 on tablet, 3 on desktop.
 */
export const ResponsiveSpans: Story = {
  render: (args) => (
    <div className="relative py-10">
      <GridOverlay />
      <PageGrid maxWidth="xl">
        <div className="col-span-full relative z-10">
          <Carousel {...args} >
            <CarouselContent>
              {Array.from({ length: 6 }, (_, i) => (
                <CarouselItem key={i} colSpan={{ sm: 2, md: 3, lg: 3 }}>
                  <GridCard label={`Card ${i + 1}`} span="2 / md:3 / lg:3" />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </PageGrid>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Items span 2 columns on mobile (4-col grid), 3 on tablet (8-col), and 3 on desktop (12-col). Uses the responsive object form: `colSpan={{ sm: 2, md: 3, lg: 3 }}`.",
      },
    },
  },
}

/**
 * Grouped carousel with short labels — no extra column reservation needed.
 */
export const GroupedBasicAlignment: Story = {
  args: {
    stickyGroupLabels: true,
    scrollBySubitem: true,
  },
  render: (args) => (
    <div className="relative py-10">
      <GridOverlay />
      <PageGrid maxWidth="xl">
        <div className="col-span-full relative z-10">
          <Carousel {...args}>
            <CarouselContent>
              <CarouselGroup>
                <CarouselGroupLabel title="Recent" subtitle="Your history" />
                <CarouselItem colSpan={{ sm: 2, lg: 3 }}>
                  <GridCard label="A1" span="2 / lg:3" />
                </CarouselItem>
                <CarouselItem colSpan={{ sm: 2, lg: 3 }}>
                  <GridCard label="A2" span="2 / lg:3" />
                </CarouselItem>
                <CarouselItem colSpan={{ sm: 2, lg: 3 }}>
                  <GridCard label="A3" span="2 / lg:3" />
                </CarouselItem>
              </CarouselGroup>

              <CarouselGroup>
                <CarouselGroupLabel title="Trending" subtitle="Popular now" />
                <CarouselItem colSpan={{ sm: 2, lg: 3 }}>
                  <GridCard label="B1" span="2 / lg:3" />
                </CarouselItem>
                <CarouselItem colSpan={{ sm: 2, lg: 3 }}>
                  <GridCard label="B2" span="2 / lg:3" />
                </CarouselItem>
                <CarouselItem colSpan={{ sm: 2, lg: 3 }}>
                  <GridCard label="B3" span="2 / lg:3" />
                </CarouselItem>
              </CarouselGroup>
            </CarouselContent>
          </Carousel>
        </div>
      </PageGrid>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Two groups with short labels. Items define the group width naturally. No extra space when labels fit within the items.",
      },
    },
  },
}

/**
 * Group label overflow with automatic column snapping.
 *
 * The first group has items spanning 1 column each but a long subtitle.
 * The group auto-snaps to the next full column boundary.
 */
export const GroupLabelOverflow: Story = {
  args: {
    stickyGroupLabels: true,
    scrollBySubitem: true,
  },
  render: (args) => (
    <div className="relative py-10">
      <GridOverlay />
      <PageGrid maxWidth="xl">
        <div className="col-span-full relative z-10">
          <Carousel {...args}>
            <CarouselContent>
              <CarouselGroup>
                <CarouselGroupLabel
                  title="CONTINUE SHOPPING"
                  subtitle="Here are vehicles you've recently viewed and saved to your garage"
                />
                <CarouselItem colSpan={{ sm: 1, lg: 2 }}>
                  <GridCard label="Car 1" span="1 / lg:2" />
                </CarouselItem>
              </CarouselGroup>

              <CarouselGroup>
                <CarouselGroupLabel
                  title="NEW TODAY"
                  subtitle="Latest 24h"
                />
                <CarouselItem colSpan={{ sm: 1, lg: 2 }}>
                  <GridCard label="New 1" span="1 / lg:2" />
                </CarouselItem>
                <CarouselItem colSpan={{ sm: 1, lg: 2 }}>
                  <GridCard label="New 2" span="1 / lg:2" />
                </CarouselItem>
                <CarouselItem colSpan={{ sm: 1, lg: 2 }}>
                  <GridCard label="New 3" span="1 / lg:2" />
                </CarouselItem>
              </CarouselGroup>
            </CarouselContent>
          </Carousel>
        </div>
      </PageGrid>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The first group has 2 items at 1-column span each, but the subtitle is wider. The group auto-snaps to the next column boundary so the second group starts on a clean grid line. Compare with GroupedBasicAlignment where short labels don't add space.",
      },
    },
  },
}

/**
 * Mixed span sizes in a single carousel.
 */
export const MixedSpans: Story = {
  render: (args) => (
    <div className="relative py-10">
      <GridOverlay />
      <PageGrid maxWidth="xl">
        <div className="col-span-full relative z-10">
          <Carousel {...args} >
            <CarouselContent>
            <CarouselItem colSpan={{ sm: 2, lg: 4 }}>
              <GridCard label="Featured" span="2 / lg:4" className="border-amber-300 bg-amber-50" />
            </CarouselItem>
            <CarouselItem colSpan={{ sm: 2, lg: 2 }}>
              <GridCard label="Small 1" span="2 / lg:2" />
            </CarouselItem>
            <CarouselItem colSpan={{ sm: 2, lg: 2 }}>
              <GridCard label="Small 2" span="2 / lg:2" />
            </CarouselItem>
            <CarouselItem colSpan={{ sm: 2, lg: 3 }}>
              <GridCard label="Medium" span="2 / lg:3" className="border-emerald-300 bg-emerald-50" />
            </CarouselItem>
            <CarouselItem colSpan={{ sm: 2, lg: 2 }}>
              <GridCard label="Small 3" span="2 / lg:2" />
            </CarouselItem>
            <CarouselItem colSpan={{ sm: 2, lg: 2 }}>
              <GridCard label="Small 4" span="2 / lg:2" />
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>
    </PageGrid>
  </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Items with different grid spans coexist. Featured spans 4 columns on desktop, standard spans 2. All edges align because widths derive from `--page-grid-col-width`.",
      },
    },
  },
}
