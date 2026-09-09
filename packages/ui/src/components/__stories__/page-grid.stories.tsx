import { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react"

import { PageGrid } from "@/components/page-grid"

const meta = {
  title: "Foundation/PageGrid",
  component: PageGrid,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A page-level responsive grid for validating column count, 8px gutters, and horizontal page padding. " +
          "Use the Storybook viewport toolbar to switch between sm, md, lg, xl widths.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    maxWidth: {
      control: "select",
      options: ["xl", "none"],
      description: "Optional max-width constraint applied to the grid container.",
    },
    as: {
      table: {
        disable: true,
      },
    },
    className: {
      table: {
        disable: true,
      },
    },
  },
  args: {
    maxWidth: "xl",
  },
} satisfies Meta<typeof PageGrid>

export default meta
type Story = StoryObj<typeof meta>

function InspectionFrame({
  children,
  title,
  description,
}: {
  children: ReactNode
  title: string
  description: string
}) {
  return (
    <section className="border border-neutral-300 bg-white shadow-sm">
      <div className="border-b border-neutral-300 bg-neutral-100 px-4 py-3 md:px-5 lg:px-10">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-600">
            {title}
          </p>
          <p className="text-sm text-neutral-600">{description}</p>
        </div>
      </div>
      <div className="py-5 md:py-6 lg:py-8">{children}</div>
    </section>
  )
}

function ColumnMarker({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <div
      className={[
        "flex h-24 items-center justify-center rounded-md border border-dashed border-neutral-400 bg-neutral-900/6",
        "text-sm font-semibold text-neutral-700",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </div>
  )
}

function SpanCard({
  label,
  className,
}: {
  label: string
  className: string
}) {
  return (
    <div
      className={[
        "rounded-lg border border-neutral-300 bg-neutral-900/8 px-4 py-4",
        "text-sm font-medium text-neutral-800",
        className,
      ].join(" ")}
    >
      {label}
    </div>
  )
}

function GridInspection({ maxWidth }: { maxWidth?: "xl" | "none" | null }) {
  return (
    <div className="bg-neutral-100 px-3 py-4 md:px-4 md:py-6">
      <div className="mx-auto flex w-full max-w-440 flex-col gap-6">
        <div className="flex items-center justify-between px-1 text-2xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
          <span>Viewport edge</span>
          <span>Switch viewport: sm / md / lg / xl</span>
          <span>Viewport edge</span>
        </div>

        <InspectionFrame
          title="Column count, gutter, and page padding"
          description="Each shaded card occupies exactly one column. The row should show 4 columns on sm, 8 on md, 12 on lg and 12 on xl. The leftover space on both sides is the PageGrid horizontal padding."
        >
          <PageGrid maxWidth={maxWidth}>
            {Array.from({ length: 4 }, (_, index) => (
              <ColumnMarker key={`base-${index + 1}`} label={`${index + 1}`} />
            ))}

            {Array.from({ length: 4 }, (_, index) => (
              <ColumnMarker
                key={`md-${index + 5}`}
                label={`${index + 5}`}
                className="hidden md:flex"
              />
            ))}

            {Array.from({ length: 4 }, (_, index) => (
              <ColumnMarker
                key={`lg-${index + 9}`}
                label={`${index + 9}`}
                className="hidden lg:flex"
              />
            ))}
          </PageGrid>
        </InspectionFrame>

        <InspectionFrame
          title="Span behavior"
          description="These items demonstrate full-width, half-width, and uneven spans at each breakpoint. Resize the viewport to confirm the spans reflow against the active column count."
        >
          <PageGrid maxWidth={maxWidth}>
            <SpanCard
              label="Full width: col-span-4 md:col-span-8 lg:col-span-12"
              className="col-span-4 md:col-span-8 lg:col-span-12"
            />
            <SpanCard
              label="Centered: col-span-4 md:col-span-6 md:col-start-2 lg:col-span-8 lg:col-start-3"
              className="col-span-4 md:col-span-6 md:col-start-2 lg:col-span-8 lg:col-start-3"
            />
            <SpanCard
              label="Half: col-span-2 md:col-span-4 lg:col-span-6"
              className="col-span-2 md:col-span-4 lg:col-span-6"
            />
            <SpanCard
              label="Half: col-span-2 md:col-span-4 lg:col-span-6"
              className="col-span-2 md:col-span-4 lg:col-span-6"
            />
            <SpanCard
              label="Offset mix: col-span-4 md:col-span-5 lg:col-span-7"
              className="col-span-4 md:col-span-5 lg:col-span-7"
            />
            <SpanCard
              label="Offset mix: col-span-4 md:col-span-3 lg:col-span-5"
              className="col-span-4 md:col-span-3 lg:col-span-5"
            />
            <SpanCard
              label="Quarter: col-span-2 md:col-span-2 lg:col-span-3"
              className="col-span-2 md:col-span-2 lg:col-span-3"
            />
            <SpanCard
              label="Quarter: col-span-2 md:col-span-2 lg:col-span-3"
              className="col-span-2 md:col-span-2 lg:col-span-3"
            />
            <SpanCard
              label="Quarter: col-span-2 md:col-span-2 lg:col-span-3"
              className="col-span-2 md:col-span-2 lg:col-span-3"
            />
            <SpanCard
              label="Quarter: col-span-2 md:col-span-2 lg:col-span-3"
              className="col-span-2 md:col-span-2 lg:col-span-3"
            />
          </PageGrid>
        </InspectionFrame>
      </div>
    </div>
  )
}

export const BaseGrid: Story = {
  name: "Base Grid",
  render: (args) => (
    <PageGrid maxWidth={args.maxWidth}>
      {Array.from({ length: 4 }, (_, index) => (
        <ColumnMarker key={`bare-base-${index + 1}`} label={`${index + 1}`} />
      ))}
      {Array.from({ length: 4 }, (_, index) => (
        <ColumnMarker
          key={`bare-md-${index + 5}`}
          label={`${index + 5}`}
          className="hidden md:flex"
        />
      ))}
      {Array.from({ length: 4 }, (_, index) => (
        <ColumnMarker
          key={`bare-lg-${index + 9}`}
          label={`${index + 9}`}
          className="hidden lg:flex"
        />
      ))}
    </PageGrid>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Raw PageGrid render with no extra wrappers. Use viewport sizes to verify 4/8/12 column transitions and spacing behavior directly.",
      },
    },
  },
}

export const GridInspectionStory: Story = {
  name: "Grid Inspection",
  render: (args) => <GridInspection maxWidth={args.maxWidth} />,
  parameters: {
    docs: {
      description: {
        story:
          "Primary visual QA story. Use the viewport toolbar to confirm 4 columns on sm, 8 on md, 12 on lg, and 12 on xl (1870px+), while inspecting the fixed 8px gutter and the responsive left/right page padding.",
      },
    },
  },
}

export const WidthConstraintComparison: Story = {
  name: "Width Constraint Comparison",
  render: () => (
    <div className="bg-neutral-100 px-3 py-4 md:px-4 md:py-6">
      <div className="mx-auto flex w-full max-w-440 flex-col gap-6">
        <InspectionFrame
          title="Default constrained width"
          description="Uses the component default max-width so the grid can center inside very wide viewports."
        >
          <PageGrid>
            {Array.from({ length: 4 }, (_, index) => (
              <ColumnMarker key={`constrained-${index + 1}`} label={`${index + 1}`} />
            ))}
            {Array.from({ length: 4 }, (_, index) => (
              <ColumnMarker
                key={`constrained-md-${index + 5}`}
                label={`${index + 5}`}
                className="hidden md:flex"
              />
            ))}
            {Array.from({ length: 4 }, (_, index) => (
              <ColumnMarker
                key={`constrained-lg-${index + 9}`}
                label={`${index + 9}`}
                className="hidden lg:flex"
              />
            ))}
          </PageGrid>
        </InspectionFrame>

        <InspectionFrame
          title="No max-width constraint"
          description="Set maxWidth to none to let the grid stretch across the available viewport while preserving the same gutter and internal padding."
        >
          <PageGrid maxWidth="none">
            {Array.from({ length: 4 }, (_, index) => (
              <ColumnMarker key={`fluid-${index + 1}`} label={`${index + 1}`} />
            ))}
            {Array.from({ length: 4 }, (_, index) => (
              <ColumnMarker
                key={`fluid-md-${index + 5}`}
                label={`${index + 5}`}
                className="hidden md:flex"
              />
            ))}
            {Array.from({ length: 4 }, (_, index) => (
              <ColumnMarker
                key={`fluid-lg-${index + 9}`}
                label={`${index + 9}`}
                className="hidden lg:flex"
              />
            ))}
          </PageGrid>
        </InspectionFrame>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Comparison story for the `maxWidth` variant. It is most useful on xl (1880px+) and wider viewports where the centered constraint becomes visible.",
      },
    },
  },
}
