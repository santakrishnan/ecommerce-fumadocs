import type { Meta, StoryObj } from "@storybook/react";
import type { JSX } from "react";

import { PriceRangeIndicator } from "@/charts/price-range-indicator";

const meta = {
  title: "Charts/PriceRangeIndicator",
  component: PriceRangeIndicator,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Price-position indicator built on [visx](https://airbnb.io/visx/) " +
          "primitives. A `viewBox`-based SVG that fluidly fills its container " +
          "width (`w-full`) — it scales with the container/viewport with no JS " +
          "measurement, so it renders identically on the server and the client. " +
          "Text/strokes use semantic `text-text-*` tokens. Resize the viewport to " +
          "see it respond; the **Narrow container** and **Boxed** stories show it " +
          "in fixed-width slots.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    min: { control: { type: "number" }},
    max: { control: { type: "number" }},
    value: { control: { type: "number" }},
    average: { control: { type: "number" }},
    valueLabel: { control: "text" },
    averageLabel: { control: "text" },
  },
  args: {
    min: 26_000,
    max: 42_000,
    value: 30_775,
    average: 34_000,
    valueLabel: "This car",
    averageLabel: "Avg",
  },
} satisfies Meta<typeof PriceRangeIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fluid — fills the viewport width. Switch the Viewport toolbar to see it scale. */
export const Default: Story = {};

/** A great deal — value sits near the low end. */
export const GreatDeal: Story = {
  args: { value: 27_200 },
};

/** Above average — value pushes into the amber/red zone. */
export const AboveMarket: Story = {
  args: { value: 39_500 },
};

/** Without an average tick. */
export const NoAverage: Story = {
  args: { average: undefined },
};

/** Out-of-range value is clamped to the max for display. */
export const ClampedToMax: Story = {
  args: { value: 99_999 },
};

/** Custom palette (e.g. brand-tinted two-stop gradient). */
export const CustomColors: Story = {
  args: {
    colors: [
      { offset: 0, color: "var(--color-blue-200)" },
      { offset: 1, color: "var(--color-green-200)" },
    ],
  },
};

/** Custom currency formatter (compact "k" notation). */
export const CustomFormatter: Story = {
  args: {
    formatValue: (n: number) => `${(n / 1000).toFixed(1)}k`,
  },
};

/** Typical usage inside a fixed-width card (constrained, centered). */
export const Boxed: Story = {
  decorators: [
    (Story: () => JSX.Element) => (
      <div style={{maxWidth: 420, margin: "0 auto", padding: 24}}>
        <Story/>
      </div>
    ),
  ],
};

/** Narrow fixed slot — shows it still scales down cleanly (text shrinks with it). */
export const NarrowContainer: Story = {
  decorators: [
    (Story: () => JSX.Element) => (
      <div style={{width: 280, padding: 24}}>
        <Story/>
      </div>
    ),
  ],
};
