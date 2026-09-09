import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * grid.css is the single source of truth for the column system.
 * PageGrid reads --page-grid-cols, --page-grid-gap, and --page-grid-margin
 * directly from those tokens so there are no duplicated values to keep in sync.
 *
 * Breakpoint layout:
 *   sm  (< 768px):   4 cols, 8px gap, 20px margin
 *   md  (>= 768px):  8 cols, 8px gap, 20px margin
 *   lg+ (>= 1024px): 12 cols, 8px gap, 40px margin
 */
const pageGridVariants = cva(
  "grid grid-cols-[repeat(var(--page-grid-cols),minmax(0,1fr))] gap-x-(--page-grid-gap) px-(--page-grid-margin)",
  {
    variants: {
      /** Maximum width constraint */
      maxWidth: {
        none: "",
        xl: "mx-auto max-w-(--breakpoint-xl)",
      },
    },
    defaultVariants: {
      maxWidth: "xl",
    },
  }
);

export interface PageGridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageGridVariants> {
  /** Render as a different element (e.g. section, main) */
  as?: React.ElementType;
  /** Ref forwarded to the root element */
  ref?: React.Ref<HTMLElement>;
}

/**
 * Page-level grid container matching the Figma grid system.
 *
 * - Mobile (< 768px): 4 columns, 8px gutter, 20px margin
 * - Tablet (≥ 768px): 8 columns, 8px gutter, 20px margin
 * - Desktop (≥ 1024px): 12 columns, 8px gutter, 40px margin
 *
 * Children use `col-span-*` utilities to occupy columns.
 *
 * @example
 * ```tsx
 * <PageGrid>
 *   <div className="col-span-4 md:col-span-8 lg:col-span-12">Full width</div>
 *   <div className="col-span-4 md:col-span-4 lg:col-span-6">Half on desktop</div>
 *   <div className="col-span-4 md:col-span-4 lg:col-span-6">Half on desktop</div>
 * </PageGrid>
 * ```
 */
function PageGrid({ as: Tag = "div", className, maxWidth, ref, ...props }: PageGridProps) {
  return (
    <Tag
      data-slot="page-grid"
      className={cn(pageGridVariants({ maxWidth }), className)}
      ref={ref}
      {...props}
    />
  );
}

export { PageGrid };
