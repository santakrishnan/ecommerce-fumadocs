import type { Meta, StoryObj } from "@storybook/react"

import { Rating } from "@/components/rating"
import { IconFuel, IconStar } from "@/icons"

const meta = {
  title: "Components/Rating",
  component: Rating,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A readonly star rating display component. Renders full, partial, and empty stars based on `value`, `max`, and `precision`. Pass custom `icon` and `emptyIcon` elements to change the shape, size, or colour — the component handles the partial-fill clipping for you. `precision` is clamped to `max` so it can never produce steps larger than the full scale.",
      },
    },
  },
  argTypes: {
    value: {
      control: { type: "number", min: 0, max: 10, step: 0.25 },
    },
    max: {
      control: { type: "number", min: 1, max: 10, step: 1 },
    },
    precision: {
      control: { type: "number", min: 0.1, max: 5, step: 0.25 },
    },
  },
  args: {
    value: 4.5,
    max: 5,
    precision: 0.25,
  },
} satisfies Meta<typeof Rating>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 4.5,
  },
  parameters: {
    docs: {
      description: {
        story: "Default 5-star display with a value of 4.5 and precision of 0.25.",
      },
    },
  },
}

export const Fractional: Story = {
  args: {
    value: 3.7,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Value of 3.7 rounded to the nearest 0.25 increment (renders as 3.75 — three full stars and one three-quarter star).",
      },
    },
  },
}

export const CustomMax: Story = {
  args: {
    value: 7,
    max: 10,
  },
  parameters: {
    docs: {
      description: {
        story: "Custom max of 10 stars with a value of 7.",
      },
    },
  },
}

export const PrecisionTwo: Story = {
  args: {
    value: 3,
    max: 5,
    precision: 2,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Precision of 2 — value 3 rounds to the nearest 2-star increment (4 stars filled). Precision is clamped to max so it cannot exceed the scale.",
      },
    },
  },
}

export const FullScore: Story = {
  args: {
    value: 5,
    max: 5,
  },
}

export const EmptyScore: Story = {
  args: {
    value: 0,
    max: 5,
  },
}

export const LargeCustomIcon: Story = {
  render: (args) => (
    <Rating
      {...args}
      icon={<IconStar className="size-8 text-brand" />}
      emptyIcon={<IconStar className="size-8 text-neutral-400" />}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Custom icon size via `className` on the `icon` and `emptyIcon` props. Partial-fill clipping works regardless of icon size.",
      },
    },
  },
}

export const CustomIconShape: Story = {
  render: (args) => (
    <Rating
      {...args}
      icon={<IconFuel className="size-5 text-brand" />}
      emptyIcon={<IconFuel className="size-5 text-neutral-400" />}
    />
  ),
  args: {
    value: 3.5,
    max: 5,
    precision: 0.25,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Any icon from the system can be used. Here `IconFuel` replaces the default star — demonstrates that the partial-fill clipping works with any icon shape.",
      },
    },
  },
}
