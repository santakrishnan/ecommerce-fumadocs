import type { Meta, StoryObj } from "@storybook/react"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/carousel"
import {
  PolyCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/card"
import { Button } from "@/components/button"
import { cn } from "@/lib/utils"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

const meta = {
  title: "Components/Carousel",
  component: Carousel,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    disableArrows: {
      control: "boolean",
      description:
        "Disable built-in arrow navigation. Explicitly provided CarouselPrevious/CarouselNext children still render.",
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description: "Scroll direction of the carousel.",
    },
    loop: {
      control: "boolean",
      description: "Enable infinite loop scrolling.",
    },
    surface: {
      control: "select",
      options: ["light", "dark"],
      description:
        "Surface color context for the carousel. Controls built-in arrow styling and is exposed as data-surface for consumer styling.",
    },
    buttonProps: {
      control: "object",
      description:
        "Props forwarded to the built-in previous/next buttons. Use this to customize arrow variant, size, or surface without rendering custom arrows.",
    },
    hoverScaleRatio: {
      control: { type: "number", min: 1, max: 1.2, step: 0.005 },
      description:
        "Optional item hover scale ratio. When > 1, CarouselContent auto-computes inset padding to avoid clipping.",
    },
    scrollBySubitem: {
      control: "boolean",
      description:
        "When true, arrow buttons and keyboard navigation scroll one individual CarouselItem at a time instead of one slide/group at a time. Defaults to true.",
    },
    disableSnap: {
      control: "boolean",
      description:
        "Disable grid-snap-on-release for horizontal drag-free carousels. When true, the track rests wherever momentum stops instead of aligning the nearest item to the start edge.",
    },
  },
  args: {
    disableArrows: false,
    orientation: "horizontal",
    loop: false,
    scrollBySubitem: true,
    disableSnap: false,
  },
} satisfies Meta<typeof Carousel>

export default meta
type Story = StoryObj<typeof meta>

function SlideCard({
  index,
  className,
}: {
  index: number
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex aspect-video items-center justify-center rounded-lg bg-neutral-100 text-lg font-semibold text-text-primary-light",
        className
      )}
    >
      Slide {index}
    </div>
  )
}

/**
 * Default horizontal carousel with multiple items.
 * Arrows are rendered automatically by the Carousel component and appear on hover at desktop breakpoints.
 */
export const Default: Story = {
  args: {
    disableArrows: false,
    orientation: "horizontal",
    loop: false,
  },
  render: (args) => {
    return (
      <div className="mx-auto max-w-3xl px-12">
        <Carousel {...args}>
          <CarouselContent>
            {Array.from({ length: 6 }, (_, i) => (
              <CarouselItem key={i} className="basis-1/3">
                <SlideCard index={i + 1} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          "Horizontal carousel with 6 items showing 3 at a time. Arrows are built-in and hidden on mobile/tablet, revealing on hover at desktop breakpoints. Use the controls panel to toggle `disableArrows` and `orientation`.",
      },
    },
  },
}

/**
 * Carousel with disableArrows set to true.
 * Built-in arrows are suppressed — navigation relies on drag/wheel/keyboard gestures.
 */
export const NoArrows: Story = {
  args: {
    disableArrows: true,
  },
  render: (args) => (
    <div className="mx-auto max-w-3xl">
      <Carousel {...args}>
        <CarouselContent>
          {Array.from({ length: 6 }, (_, i) => (
            <CarouselItem key={i} className="basis-1/3">
              <SlideCard index={i + 1} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates `disableArrows={true}`. The built-in arrows are suppressed. Navigation is still possible via drag, wheel, or keyboard.",
      },
    },
  },
}

/**
 * Items with hover scale/shadow driven by CarouselContent.
 * Consumers only provide hoverScaleRatio and the component applies hover styles + dynamic inset math.
 *
 * Hover inset is computed at runtime from hoverScaleRatio and measured item size.
 * Set hoverScaleRatio to 1 to disable additional inset.
 */
export const AdaptiveHover: Story = {
  args: {
    hoverScaleRatio: 1.025,
  },
  render: (args) => (
    <div className="mx-auto max-w-3xl px-12 py-8">
      <Carousel {...args}>
        <CarouselContent className="-ml-4">
          {Array.from({ length: 8 }, (_, i) => (
            <CarouselItem key={i} className="basis-1/3 pl-4">
              <div className="rounded-lg bg-neutral-100 p-4 focus-visible:ring-2 focus-visible:ring-ring">
                <div className="flex aspect-video items-center justify-center text-lg font-semibold text-text-primary-light">
                  Card {i + 1}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Cards scale on hover with hover shadow. The component applies hover/focus transforms and computes viewport inset dynamically at runtime from `hoverScaleRatio` and measured item size so scaled cards and shadows do not clip. Omit `hoverScaleRatio` or set it to `1` to disable additional inset.",
      },
    },
  },
}

/**
 * Vertical orientation with correct arrow placement on top/bottom edges.
 */
export const Vertical: Story = {
  args: {
    orientation: "vertical",
  },
  render: (args) => (
    <div className="mx-auto flex max-w-sm justify-center py-12">
      <Carousel {...args} className="h-125 w-full">
        <CarouselContent className="h-125">
          {Array.from({ length: 6 }, (_, i) => (
            <CarouselItem key={i} className="basis-1/2">
              <div className="flex h-full items-center justify-center rounded-lg bg-neutral-100 text-lg font-semibold text-text-primary-light">
                Slide {i + 1}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Vertical carousel with arrows centered on the top and bottom edges. Each button midpoint aligns to the corresponding carousel edge.",
      },
    },
  },
}

/**
 * Few items that fit within the container — no overflow.
 * Arrows do not render, drag-to-scroll and wheel gestures are inactive.
 */
export const NoOverflow: Story = {
  render: (args) => (
    <div className="mx-auto max-w-3xl px-12">
      <Carousel {...args}>
        <CarouselContent>
          {Array.from({ length: 2 }, (_, i) => (
            <CarouselItem key={i} className="basis-1/3">
              <SlideCard index={i + 1} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Only 2 items in a container that fits 3. Items do not overflow, so arrows are hidden, drag-to-scroll is disabled, and wheel gestures do not activate.",
      },
    },
  },
}

/**
 * Many items to demonstrate prev/next enabled and disabled states.
 * At the start, Previous is disabled. At the end, Next is disabled.
 */
export const ManyItems: Story = {
  render: (args) => (
    <div className="mx-auto max-w-3xl px-12">
      <Carousel {...args}>
        <CarouselContent>
          {Array.from({ length: 20 }, (_, i) => (
            <CarouselItem key={i} className="basis-1/4">
              <div className="flex aspect-square items-center justify-center rounded-lg bg-neutral-100 text-sm font-semibold text-text-primary-light">
                {i + 1}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "20 items in a horizontal carousel showing 4 at a time. Scroll to the edges to observe the Previous button becoming disabled at the start and the Next button becoming disabled at the end.",
      },
    },
  },
}

/**
 * Free scrolling with `disableSnap` — the track rests wherever momentum stops.
 * By default a drag-free carousel eases the nearest item to the start edge on
 * release; setting `disableSnap` opts out of that alignment.
 */
export const DisableSnap: Story = {
  args: {
    disableSnap: true,
  },
  render: (args) => (
    <div className="mx-auto max-w-3xl px-12">
      <Carousel {...args}>
        <CarouselContent>
          {Array.from({ length: 12 }, (_, i) => (
            <CarouselItem key={i} className="basis-1/4">
              <div className="flex aspect-square items-center justify-center rounded-lg bg-neutral-100 text-sm font-semibold text-text-primary-light">
                {i + 1}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates `disableSnap={true}`. Drag or flick the track and release — it glides to a free resting position instead of snapping the nearest item to the start edge. Toggle `disableSnap` in the controls to compare with the default snap-on-release behavior.",
      },
    },
  },
}

/**
 * Carousel with `buttonProps` forwarded to both built-in arrow buttons.
 * Setting `surface="dark"` on `buttonProps` switches the arrows to their
 * dark-surface token set — useful when the carousel sits on a dark or image
 * background while the parent Carousel `surface` remains `"light"`.
 */
export const ButtonPropsOverride: Story = {
  name: "buttonProps — surface override",
  args: {
    surface: "light",
    buttonProps: { variant: "secondary", surface: "dark" },
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-3xl px-12 rounded-xl bg-opacity-black-40 py-8">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <Carousel {...args}>
      <CarouselContent>
        {Array.from({ length: 6 }, (_, i) => (
          <CarouselItem key={i} className="basis-1/3">
            <SlideCard index={i + 1} className="bg-card-dark text-text-primary-dark" />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Passes `buttonProps={{ surface: \"dark\" }}` to apply dark-surface button tokens to the built-in arrow buttons independently of the carousel's own `surface` prop. Handy when the carousel container has a dark background but the rest of the page is light.",
      },
    },
  },
}

/**
 * Custom arrows using the useCarousel hook with disableArrows.
 * Built-in arrows are disabled. Custom buttons use useCarousel() to access scroll methods directly.
 * This demonstrates the one-off composition pattern for teams that need non-standard arrow behavior.
 */
function CustomArrows() {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel()

  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      <Button
        variant="secondary"
        size="icon-sm"
        className="rounded-full"
        disabled={!canScrollPrev}
        onClick={(e) => {
          e.stopPropagation()
          scrollPrev()
        }}
        aria-label="Previous slide"
      >
        <ChevronLeftIcon />
      </Button>
      <Button
        variant="secondary"
        size="icon-sm"
        className="rounded-full"
        disabled={!canScrollNext}
        onClick={(e) => {
          e.stopPropagation()
          scrollNext()
        }}
        aria-label="Next slide"
      >
        <ChevronRightIcon />
      </Button>
    </div>
  )
}

export const ExplicitArrows: Story = {
  args: {
    disableArrows: true,
    surface: 'light'
  },
  render: (args) => (
    <div className="mx-auto max-w-3xl">
      <Carousel {...args}>
        <CarouselContent>
          {Array.from({ length: 6 }, (_, i) => (
            <CarouselItem key={i} className="basis-1/3">
              <SlideCard index={i + 1} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CustomArrows />
      </Carousel>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates a custom one-off composition with `disableArrows={true}`. Custom arrow buttons use the `useCarousel()` hook to access `scrollPrev`/`scrollNext` and `canScrollPrev`/`canScrollNext` directly, allowing full control over placement, styling, and visibility.",
      },
    },
  },
}


/**
 * Carousel with data-carousel-focus — targeted arrow-key navigation.
 *
 * When a child inside a CarouselItem has `data-carousel-focus`, arrow keys
 * focus that element directly instead of the CarouselItem wrapper. This is
 * useful when the item contains an interactive PolyCard (link/button) that
 * should receive focus for proper keyboard UX.
 *
 * Without `data-carousel-focus`, focus falls back to the CarouselItem itself
 * (which has tabIndex={0}).
 */
export const WithFocusTarget: Story = {
  name: "With data-carousel-focus",
  decorators: [
    (Story) => (
      <div className="w-200">
        <Story />
      </div>
    ),
  ],
  args: {
    hoverScaleRatio: 1.05
  },
  render: (args) => {
    const cards = [
      { title: "Card One", href: "#one" },
      { title: "Card Two", href: "#two" },
      { title: "Card Three", href: "#three" },
      { title: "Card Four", href: "#four" },
    ]

    return (
      <Carousel {...args} opts={{ align: "start" }}>
        <CarouselContent>
          {cards.map((card) => (
            <CarouselItem key={card.href} className="basis-1/3">
              <PolyCard
                render={<a href={card.href} aria-label={card.title} data-carousel-focus />}
              >
                <CardHeader>
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription>
                    Arrow keys focus this link via data-carousel-focus.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Tab to carousel, then use ← → to navigate between cards.
                  </p>
                </CardContent>
              </PolyCard>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          "Add `data-carousel-focus` to any element inside a CarouselItem to make it the arrow-key focus target. Falls back to the item div when no focus target is marked.",
      },
    },
  },
}
