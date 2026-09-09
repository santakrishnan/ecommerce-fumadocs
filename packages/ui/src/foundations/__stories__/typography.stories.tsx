import type React from "react"
import type { Meta, StoryObj } from "@storybook/react"

import { cn } from "@/lib/utils"

type ResponsivePattern = "lg-to-xl" | "xl"

type TypographyRow = {
  utility: string
  responsive: ResponsivePattern
  size: string
  weight: string
  leading: string
  tracking: string
  extra: string
}

type TypographyGroup = {
  title: string
  rows: TypographyRow[]
}

const typographyGroups: TypographyGroup[] = [
  {
    title: "Numbers",
    rows: [
      {
        utility: "number-xl",
        responsive: "lg-to-xl",
        size: "48px → 56px → 72px",
        weight: "Bold",
        leading: "1.05",
        tracking: "-4%",
        extra: "—",
      },
      {
        utility: "number-lg",
        responsive: "xl",
        size: "32px → 42px",
        weight: "Bold",
        leading: "1.05",
        tracking: "-4%",
        extra: "—",
      },
    ],
  },
  {
    title: "Headings",
    rows: [
      {
        utility: "h1",
        responsive: "lg-to-xl",
        size: "28px → 32px → 42px",
        weight: "Bold",
        leading: "1.05",
        tracking: "-4%",
        extra: "—",
      },
      {
        utility: "h2",
        responsive: "lg-to-xl",
        size: "24px → 28px → 42px",
        weight: "Bold",
        leading: "1.05",
        tracking: "-4%",
        extra: "—",
      },
      {
        utility: "h3",
        responsive: "lg-to-xl",
        size: "22px → 24px → 30px",
        weight: "Bold",
        leading: "1.05",
        tracking: "-4%",
        extra: "—",
      },
    ],
  },
  {
    title: "Vehicle Titles",
    rows: [
      {
        utility: "vehicle-title-lg",
        responsive: "lg-to-xl",
        size: "24px → 28px → 36px",
        weight: "Bold",
        leading: "1.05",
        tracking: "-4%",
        extra: "uppercase",
      },
      {
        utility: "vehicle-title-md",
        responsive: "lg-to-xl",
        size: "16px → 24px → 28px",
        weight: "Bold",
        leading: "1.05",
        tracking: "-4%",
        extra: "uppercase",
      },
      {
        utility: "vehicle-title-sm",
        responsive: "lg-to-xl",
        size: "14px → 16px → 20px",
        weight: "Bold",
        leading: "1.05",
        tracking: "-4%",
        extra: "uppercase",
      },
    ],
  },
  {
    title: "Subheads",
    rows: [
      {
        utility: "subhead-lg",
        responsive: "xl",
        size: "16px → 20px",
        weight: "Semibold",
        leading: "1.05",
        tracking: "-4%",
        extra: "—",
      },
      {
        utility: "subhead-sm",
        responsive: "xl",
        size: "14px → 18px",
        weight: "Semibold",
        leading: "1.05",
        tracking: "-4%",
        extra: "—",
      },
    ],
  },
  {
    title: "Body",
    rows: [
      {
        utility: "body-xxl",
        responsive: "lg-to-xl",
        size: "22px → 28px → 36px",
        weight: "Normal",
        leading: "1.3",
        tracking: "-2%",
        extra: "—",
      },
      {
        utility: "body-xl",
        responsive: "lg-to-xl",
        size: "18px → 24px → 32px",
        weight: "Normal",
        leading: "1.3",
        tracking: "-2%",
        extra: "—",
      },
      {
        utility: "body-lg",
        responsive: "xl",
        size: "16px → 20px",
        weight: "Normal",
        leading: "1.3",
        tracking: "-2%",
        extra: "—",
      },
      {
        utility: "body-md",
        responsive: "xl",
        size: "14px → 18px",
        weight: "Normal",
        leading: "1.3",
        tracking: "-2%",
        extra: "—",
      },
      {
        utility: "body-sm",
        responsive: "xl",
        size: "12px → 14px",
        weight: "Normal",
        leading: "1.3",
        tracking: "-2%",
        extra: "—",
      },
      {
        utility: "disclaimer",
        responsive: "xl",
        size: "10px → 12px",
        weight: "Normal",
        leading: "1.3",
        tracking: "-2%",
        extra: "—",
      },
    ],
  },
  {
    title: "Interactive",
    rows: [
      {
        utility: "carousel-headline",
        responsive: "xl",
        size: "14px → 18px",
        weight: "Bold",
        leading: "1.05",
        tracking: "-4%",
        extra: "uppercase",
      },
      {
        utility: "button-text",
        responsive: "xl",
        size: "14px → 16px",
        weight: "Semibold",
        leading: "1.05",
        tracking: "-4%",
        extra: "—",
      },
      {
        utility: "link-text",
        responsive: "xl",
        size: "12px → 14px",
        weight: "Semibold",
        leading: "1.05",
        tracking: "-4%",
        extra: "—",
      },
    ],
  },
]

const usageExampleLines = [
  { tag: "h1", className: "h1", content: "Page Title" },
  { tag: "p", className: "body-lg", content: "Default paragraph text." },
  {
    tag: "p",
    className: "body-sm xl:body-lg",
    content: "Responsive — small on mobile, larger at xl.",
  },
  { tag: "span", className: "vehicle-title-md", content: "RAV4 Prime" },
]

const RESPONSIVE_LABELS: Record<ResponsivePattern, string> = {
  "lg-to-xl": "lg → xl",
  xl: "xl only",
}

/* ─── Matrix Row ─── */
function MatrixRow({
  utility,
  responsive,
}: {
  utility: string
  responsive: ResponsivePattern
}) {
  return (
    <div className="grid grid-cols-1 gap-2 py-2 md:grid-cols-[180px_120px_minmax(0,1fr)] md:items-baseline md:gap-4">
      <div>
        <code className="font-mono text-xs text-text-secondary">{utility}</code>
      </div>
      <span className="font-mono text-2xs text-text-tertiary">{RESPONSIVE_LABELS[responsive]}</span>
      <p className={cn(utility, "truncate text-text-primary")}>
        The quick brown fox jumps over the lazy dog
      </p>
    </div>
  )
}

/* ─── Category Group ─── */
function CategoryGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col">
      <p className="border-b border-border pb-1 font-mono text-2xs uppercase tracking-wide text-text-tertiary">
        {title}
      </p>
      <div className="flex flex-col">{children}</div>
    </div>
  )
}

/* ─── Storybook Meta ─── */
const meta = {
  title: "Foundation/Typography",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/**
 * All 19 typography utilities in a compact matrix view.
 * Use Storybook's "Change viewport" toolbar to resize and compare the
 * `lg → xl` and `xl only` responsive patterns.
 */
export const Matrix: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <p className="body-sm text-text-secondary">
        Resize the preview to compare utilities that step at both
        <code className="mx-1 font-mono text-sm">lg</code>
        and
        <code className="mx-1 font-mono text-sm">xl</code>
        with utilities that stay at their base size until
        <code className="mx-1 font-mono text-sm">xl</code>.
      </p>
      <div className="hidden grid-cols-[180px_120px_minmax(0,1fr)] gap-4 border-b border-border pb-2 font-mono text-2xs uppercase tracking-wide text-text-tertiary md:grid">
        <span>Utility</span>
        <span>Breakpoints</span>
        <span>Preview</span>
      </div>
      {typographyGroups.map((group) => (
        <CategoryGroup key={group.title} title={group.title}>
          {group.rows.map((row) => (
            <MatrixRow
              key={row.utility}
              utility={row.utility}
              responsive={row.responsive}
            />
          ))}
        </CategoryGroup>
      ))}
    </div>
  ),
}

const referenceRows = typographyGroups.flatMap((group) => group.rows)

/**
 * Quick-reference table showing the CSS properties each utility applies.
 */
export const Reference: Story = {
  render: () => (
    <div className="flex flex-col gap-6 text-text-primary">
      <h2 className="h2 border-b border-border pb-2">Reference</h2>
      <p className="body-lg">
        Each utility applies a complete typographic preset. Utilities now either step through
        both <code className="font-mono text-sm">lg → xl</code> or stay at their base size
        until <code className="font-mono text-sm">xl</code>. The breakpoint column in both
        stories shows which pattern each utility follows. For custom handoffs, combine a
        utility with responsive prefixes such as <code className="font-mono text-sm">body-sm xl:body-lg</code>.
      </p>

      <pre className="overflow-x-auto rounded border border-border bg-surface-secondary p-4 font-mono text-xs leading-relaxed">
        {usageExampleLines.map((line) => (
          <span key={`${line.tag}-${line.className}`} className="block">
            {"<"}
            {line.tag}
            {" className=\""}
            {line.className}
            {"\""}
            {">"}
            {line.content}
            {"</"}
            {line.tag}
            {">"}
          </span>
        ))}
      </pre>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border text-text-secondary">
            <th className="subhead-sm p-2">Utility</th>
            <th className="subhead-sm p-2">Responsive</th>
            <th className="subhead-sm p-2">Size</th>
            <th className="subhead-sm p-2">Weight</th>
            <th className="subhead-sm p-2">Leading</th>
            <th className="subhead-sm p-2">Tracking</th>
            <th className="subhead-sm p-2">Extra</th>
          </tr>
        </thead>
        <tbody>
          {referenceRows.map((row) => (
            <tr key={row.utility} className="border-b border-border">
              <td className="p-2 font-mono text-sm font-semibold">{row.utility}</td>
              <td className="body-sm p-2">{RESPONSIVE_LABELS[row.responsive]}</td>
              <td className="body-sm p-2">{row.size}</td>
              <td className="body-sm p-2">{row.weight}</td>
              <td className="body-sm p-2">{row.leading}</td>
              <td className="body-sm p-2">{row.tracking}</td>
              <td className="body-sm p-2">{row.extra}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
}
