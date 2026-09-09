"use client"

import { createContext, use } from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import type { Surface } from "@/lib/types"

// ─── Prop Interfaces ────────────────────────────────────────────────────────

type TabsVariant = "default" | "pill"

const TabsVariantContext = createContext<TabsVariant>("default")

interface TabsProps extends TabsPrimitive.Root.Props {
  orientation?: "horizontal" | "vertical"
  surface?: Surface
}

interface TabsListProps extends TabsPrimitive.List.Props {
  variant?: TabsVariant
  surface?: Surface
}

const tabsTriggerVariants = cva(
  [
    // Layout
    "relative inline-flex flex-1 items-center justify-center whitespace-nowrap",
    // Colors — surface-aware via CSS custom properties
    "text-text-tertiary transition-colors duration-200 motion-reduce:transition-none",
    // Icon gap
    "gap-1",
    // Focus — preserve existing
    "outline-none select-none",
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring",
    // Disabled — preserve existing
    "disabled:pointer-events-none disabled:text-text-inactive",
    "aria-disabled:pointer-events-none aria-disabled:text-text-inactive",
    // SVG children
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    // Dark mode (CSS .dark class) — preserve existing
    "dark:text-muted-foreground dark:hover:text-foreground",
  ],
  {
    variants: {
      variant: {
        default: [
          // Typography — Toyota Type Bold, 105% line-height, -0.56px tracking (Figma spec)
          "carousel-headline",
          // Hover — preserve existing
          "hover:text-text-primary",
          // Active state — lift color, horizontal bottom border indicator
          "data-active:text-text-primary",
          // Vertical orientation: full width, left-aligned
          "group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start",
          // Horizontal: reserve border space for all tabs to avoid active/inactive jump
          "group-data-[orientation=horizontal]/tabs:border-b group-data-[orientation=horizontal]/tabs:border-b-transparent",
          // Horizontal active: 1px solid bottom border using text-primary color
          "group-data-[orientation=horizontal]/tabs:data-active:border-b group-data-[orientation=horizontal]/tabs:data-active:border-b-text-primary",
          // Horizontal active: 12px bottom padding between text and border
          "group-data-[orientation=horizontal]/tabs:pb-3",
        ],
        pill: [
          // Typography — body-sm (12px, normal, 1.3 line-height, -0.02em tracking)
          "body-sm",
          // Layout — mirrors button: shrink-0, border border-transparent, bg-clip-padding, min-h
          "flex-none shrink-0 self-center",
          "rounded-full",
          "border border-transparent bg-clip-padding",
          "min-h-12 px-4 sm:px-5",
          "gap-2",
          // Colors — unselected
          "bg-transparent text-(--tabs-pill-trigger-unselected-text)",
          // Colors — selected
          "data-active:bg-(--tabs-pill-trigger-selected-bg) data-active:text-(--tabs-pill-trigger-selected-text)",
          // Hover — only when not disabled and not active
          "not-disabled:not-[data-active]:hover:bg-(--tabs-pill-trigger-hover-bg) not-disabled:not-[data-active]:hover:text-(--tabs-pill-trigger-hover-text)",
          // Disabled — matches button primary disabled pattern
          "disabled:bg-(--tabs-pill-trigger-disabled-bg) disabled:text-(--tabs-pill-trigger-disabled-text)",
          "aria-disabled:bg-(--tabs-pill-trigger-disabled-bg) aria-disabled:text-(--tabs-pill-trigger-disabled-text)",
          // Override dark mode defaults (pill uses surface tokens)
          "dark:text-(--tabs-pill-trigger-unselected-text)",
        ],
      },
      size: {
        sm: "",
        lg: "",
      },
    },
    compoundVariants: [
      { variant: "default", size: "sm", class: "body-sm" },
      { variant: "default", size: "lg", class: "body-md uppercase" },
    ],
    defaultVariants: {
      variant: "default",
      size: "lg",
    },
  }
)

interface TabsTriggerProps
  extends TabsPrimitive.Tab.Props,
    Pick<VariantProps<typeof tabsTriggerVariants>, "size"> {
  surface?: Surface
}

interface TabsContentProps extends TabsPrimitive.Panel.Props {}

// ─── Components ─────────────────────────────────────────────────────────────

function Tabs({
  className,
  orientation = "horizontal",
  surface,
  ...props
}: TabsProps) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      {...(surface !== undefined ? { "data-surface": surface } : {})}
      className={cn(
        // flex layout; gap-6 (24px) between TabsList and TabsContent
        "group/tabs flex gap-6 data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function TabsList({ className, variant = "default", surface, ...props }: TabsListProps) {
  return (
    <TabsVariantContext value={variant}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={variant}
        {...(surface !== undefined ? { "data-surface": surface } : {})}
        className={cn(
          // Container — no background, no pill
          "inline-flex w-fit items-center",
          variant === "default" && [
            // Orientation-specific gaps: 16px horizontal, 20px vertical
            "group-data-[orientation=horizontal]/tabs:flex-row group-data-[orientation=horizontal]/tabs:gap-4",
            "group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col group-data-[orientation=vertical]/tabs:gap-5",
          ],
          variant === "pill" && "flex-row rounded-full p-1 gap-0 bg-(--tabs-pill-list-bg) glass",
          className
        )}
        {...props}
      />
    </TabsVariantContext>
  )
}

function TabsTrigger({ className, size, surface, ...props }: TabsTriggerProps) {
  const variant = use(TabsVariantContext)
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      data-variant={variant}
      {...(surface !== undefined ? { "data-surface": surface } : {})}
      className={cn(tabsTriggerVariants({ variant, size }), className)}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsContentProps) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
export type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps }
