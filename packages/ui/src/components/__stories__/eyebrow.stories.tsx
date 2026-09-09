import type { Meta, StoryObj } from "@storybook/react";
import { MapPin, Sparkles } from "lucide-react";

import { Eyebrow } from "@/components/eyebrow";

/**
 * A small inline label with an optional leading icon, aligned with the
 * [Toyota Design Library — Eyebrow](https://www.figma.com/design/7jjFjOTZe0jmljcXpQXF0A/Toyota-Design-Library?node-id=4482-5945&m=dev).
 *
 * Used as an editorial card eyebrow (label above the headline) and inventory
 * card AI-description line (icon + blurb below the metadata).
 *
 * Typography is always Body-Small (12px). The component uses `text-text-primary`
 * which is surface-aware — it adapts automatically when inside a
 * `data-surface="dark"` ancestor.
 */
const meta = {
  title: "Components/Eyebrow",
  component: Eyebrow,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A small inline label with an optional leading icon, aligned with the " +
          "[Toyota Design Library — Eyebrow](https://www.figma.com/design/7jjFjOTZe0jmljcXpQXF0A/Toyota-Design-Library?node-id=4482-5945&m=dev). " +
          "Typography is always Body-Small (12px). Uses `text-text-primary` (surface-aware) and sizes icons " +
          "automatically via `[&>svg]:size-3.5`. Pass a bare icon child with no per-icon size class.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    className: {
      control: "text",
      description: "Consumer-applied classes (e.g. positional margin)",
    },
  },
  args: {
    children: "5 new matches",
  },
} satisfies Meta<typeof Eyebrow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default — Body-Small (12px) text with no icon. */
export const Default: Story = {};

/** With a leading icon — icon is auto-sized to 14px via `[&>svg]:size-3.5`. */
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <MapPin />
        Trending near you
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Pass any SVG icon as a direct child — no size class needed. The component applies `[&>svg]:size-3.5 [&>svg]:shrink-0` automatically.",
      },
    },
  },
};

/** On a dark surface — `text-text-primary` resolves to light text via ancestor `data-surface="dark"`. */
export const OnDarkSurface: Story = {
  args: {
    children: "Based on your recent search",
  },
  decorators: [
    (Story) => (
      <div className="rounded-lg bg-neutral-900 p-6" data-surface="dark">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates surface-aware text colour. `text-text-primary` automatically resolves to light text when inside a `data-surface="dark"` ancestor — no explicit prop needed on the component.',
      },
    },
  },
};

/** With icon on a dark surface — real-world editorial card pattern. */
export const WithIconOnDarkSurface: Story = {
  args: {
    children: (
      <>
        <Sparkles />
        12 new matches
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div className="rounded-lg bg-neutral-900 p-6" data-surface="dark">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: "Editorial card eyebrow pattern — icon + label on a dark image overlay.",
      },
    },
  },
};

/** With contextual margin — demonstrating className passthrough for positional styling. */
export const WithContextualMargin: Story = {
  args: {
    className: "mt-2",
    children: (
      <>
        <Sparkles />
        Great fuel economy
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Inventory card AI-description pattern — `mt-2` is the only contextual class. The component owns no external margins.",
      },
    },
  },
};
