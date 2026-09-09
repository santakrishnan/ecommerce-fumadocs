import type { Meta, StoryObj } from "@storybook/react"

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/item"
import { IconToyotaX, IconCaretRight } from "@/icons"

/**
 * Item — a composable, surface-aware suggestion card.
 *
 * The background, text, and icon colors adapt to the surface context:
 * translucent white on dark surfaces (frosted glass) and opaque white on light
 * surfaces. Surface is inherited from any `[data-surface]` ancestor, or set
 * explicitly via the `surface` prop. The component is fully composable: image
 * overlay, text colors, chevron, and spark icon are all consumer-composed via slots.
 */
const meta = {
  title: "Components/Item",
  component: Item,
  parameters: {
    layout: "padded",
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#262626" },
        { name: "overlay", value: "rgba(0,0,0,0.70)" },
        { name: "light", value: "#ffffff" },
      ],
    },
    docs: {
      description: {
        component:
          "A composable, surface-aware suggestion card. " +
          "Its background/text/icon colors adapt to the surface context via the " +
          "`surface-light:` / `surface-dark:` variants — opaque white on light surfaces, " +
          "translucent frosted glass on dark. Surface is inherited from a `[data-surface]` " +
          "ancestor or set via the `surface` prop. " +
          "Built on [Base UI useRender](https://base-ui.com/react/utils/use-render) for polymorphic rendering. " +
          "Original shadcn implementation: [shadcn/ui Item (Base)](https://ui.shadcn.com/docs/components/base/item).",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <div className="max-w-xl rounded-2xl p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Item>

export default meta
type Story = StoryObj<typeof meta>

const SAMPLE_IMAGE = "https://placehold.co/72x72/374151/9ca3af?text=Car"

const Chevron = () => (
  <IconCaretRight aria-hidden="true" className="size-5" />
)

/** Default suggestion card — 72px image, title, subtitle, and chevron on dark background. */
export const Default: Story = {
  globals: {
    backgrounds: { value: "black" },
  },
  render: () => (
    <Item>
      <ItemMedia variant="image" className="relative">
        <img src={SAMPLE_IMAGE} alt="Vehicle" className="object-cover" />
        <div className="absolute inset-0 rounded-md bg-black/20" />
      </ItemMedia>
      <ItemContent className="gap-2">
        <ItemTitle>
          Our most popular models in Greater LA
        </ItemTitle>
        <ItemDescription className="flex items-center gap-2">
          Near you &bull; 11201
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Chevron />
      </ItemActions>
    </Item>
  ),
}

/** Mobile variant — image is 60px on mobile, 72px on tablet+ (responsive via CVA default). Title wraps to 2 lines. */
export const Mobile: Story = {
  render: () => (
    <Item>
      <ItemMedia variant="image" className="relative">
        <img src={SAMPLE_IMAGE} alt="Vehicle" className="object-cover" />
        <div className="absolute inset-0 rounded-md bg-black/20" />
      </ItemMedia>
      <ItemContent className="gap-2">
        <ItemTitle>
          Family friendly SUVs with top rated safety features and cargo space
        </ItemTitle>
        <ItemDescription className="flex items-center gap-2">
          Ample cargo space that flexes to all your different needs
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Chevron />
      </ItemActions>
    </Item>
  ),
}

/** As a link — uses render prop for polymorphic navigation. Shows hover/focus states. */
export const AsLink: Story = {
  render: () => (
    <Item render={<a href="#example" />}>
      <ItemMedia variant="image" className="relative">
        <img src={SAMPLE_IMAGE} alt="Vehicle" className="object-cover" />
        <div className="absolute inset-0 rounded-md bg-black/20" />
      </ItemMedia>
      <ItemContent className="gap-2">
        <ItemTitle>
          Fuel efficient hybrids and EVs
        </ItemTitle>
        <ItemDescription className="flex items-center gap-2">
          Maximize your savings with a hybrid or electric vehicle
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Chevron />
      </ItemActions>
    </Item>
  ),
}


/** With spark icon — subtitle includes the spark icon before the text (consumer-composed). */
export const WithSpark: Story = {
  render: () => (
    <Item>
      <ItemMedia variant="image" className="relative">
        <img src={SAMPLE_IMAGE} alt="Vehicle" className="object-cover" />
        <div className="absolute inset-0 rounded-md bg-black/20" />
      </ItemMedia>
      <ItemContent className="gap-2">
        <ItemTitle>
          Our most popular models in Greater LA
        </ItemTitle>
        <ItemDescription className="flex items-center gap-2">
          <IconToyotaX className="size-2 shrink-0" />
          <span>Near you &bull; 11201</span>
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Chevron />
      </ItemActions>
    </Item>
  ),
}

/** In a group — multiple items in an ItemGroup, verifies spacing between cards. */
export const InGroup: Story = {
  render: () => (
    <ItemGroup>
      <Item role="listitem">
        <ItemMedia variant="image" className="relative">
          <img src={SAMPLE_IMAGE} alt="Vehicle" className="object-cover" />
          <div className="absolute inset-0 rounded-md bg-black/20" />
        </ItemMedia>
        <ItemContent className="gap-2">
          <ItemTitle>
            Our most popular models in Greater LA
          </ItemTitle>
          <ItemDescription className="flex items-center gap-2">
            Near you &bull; 11201
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Chevron />
        </ItemActions>
      </Item>
      <Item role="listitem">
        <ItemMedia variant="image" className="relative">
          <img src={SAMPLE_IMAGE} alt="Vehicle" className="object-cover" />
          <div className="absolute inset-0 rounded-md bg-black/20" />
        </ItemMedia>
        <ItemContent className="gap-2">
          <ItemTitle>
            Budget-friendly options nearby
          </ItemTitle>
          <ItemDescription className="flex items-center gap-2">
            Under $30k &bull; All types
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Chevron />
        </ItemActions>
      </Item>
      <Item role="listitem">
        <ItemMedia variant="image" className="relative">
          <img src={SAMPLE_IMAGE} alt="Vehicle" className="object-cover" />
          <div className="absolute inset-0 rounded-md bg-black/20" />
        </ItemMedia>
        <ItemContent className="gap-2">
          <ItemTitle >
            Fuel efficient hybrids and EVs
          </ItemTitle>
          <ItemDescription className="flex items-center gap-2">
            Hybrid &amp; Electric &bull; 30+ mpg
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Chevron />
        </ItemActions>
      </Item>
    </ItemGroup>
  ),
}

/**
 * On a light surface — `surface="light"` makes the Item opaque white with dark
 * text, suitable for light-background pages (e.g. dialogs). No image overlay is
 * used here since the card sits on white rather than a photo.
 */
export const OnLightSurface: Story = {
  globals: {
    backgrounds: { value: "light" },
  },
  render: () => (
    <Item surface="light">
      <ItemContent className="gap-2">
        <ItemTitle>Fuel efficient hybrids and EVs</ItemTitle>
        <ItemDescription>Hybrid &amp; Electric &bull; 30+ mpg</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Chevron />
      </ItemActions>
    </Item>
  ),
}
