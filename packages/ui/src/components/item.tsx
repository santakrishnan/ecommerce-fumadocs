import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/separator"
import type { Surface } from "@/lib/types"

/* ─── Interfaces ─── */

interface ItemGroupProps extends React.ComponentProps<"div"> {}

interface ItemSeparatorProps extends React.ComponentProps<typeof Separator> {}

interface ItemProps
  extends useRender.ComponentProps<"div">,
    VariantProps<typeof itemVariants> {
  /**
   * Surface context stamped as a `data-surface` attribute, letting the Item
   * establish its own surface rather than inheriting from an ancestor.
   * Used by theme tokens to adapt background, text, and icon colors
   * (e.g. `"dark"`, `"light"`).
   */
  surface?: Surface
}

interface ItemMediaProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof itemMediaVariants> {}

interface ItemContentProps extends React.ComponentProps<"div"> {}

interface ItemTitleProps extends React.ComponentProps<"div"> {}

interface ItemDescriptionProps extends React.ComponentProps<"p"> {}

interface ItemActionsProps extends React.ComponentProps<"div"> {}

interface ItemHeaderProps extends React.ComponentProps<"div"> {}

interface ItemFooterProps extends React.ComponentProps<"div"> {}

/* ─── Components ─── */

function ItemGroup({ className, ...props }: ItemGroupProps) {
  return (
    <div
      role="list"
      data-slot="item-group"
      className={cn(
        "group/item-group flex w-full flex-col gap-4 has-data-[size=sm]:gap-2.5 has-data-[size=xs]:gap-2",
        className
      )}
      {...props}
    />
  )
}

function ItemSeparator({
  className,
  ...props
}: ItemSeparatorProps) {
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      className={cn("my-2", className)}
      {...props}
    />
  )
}

/**
 * Item variant styles.
 *
 * Surface-aware via the `surface-light:` / `surface-dark:` custom variants
 * (defined in @ucmp/ui-theme). The default variant renders opaque white on
 * light surfaces and translucent frosted glass on dark surfaces (matching the
 * original `bg-white/20`). Text and icon colors follow the same pattern in the
 * sub-components below.
 *
 * The surface is inherited from any `[data-surface]` ancestor, or set explicitly
 * via the `surface` prop on `Item`.
 */
const itemVariants = cva(
  "group/item flex w-full flex-wrap items-center border text-sm transition-colors duration-100 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [a]:transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-white surface-dark:bg-white/20 surface-dark:glass rounded-xl",
        // Future variants:
        // outline: "border-border rounded-md",
        // muted: "border-transparent bg-muted/50 rounded-md",
      },
      size: {
        default: "gap-4 md:gap-5 py-3 pl-3 pr-5",
        // Future sizes:
        // sm: "gap-2.5 px-3 py-2.5",
        // xs: "gap-2 px-2.5 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Item({
  className,
  variant = "default",
  size = "default",
  surface,
  render,
  ...props
}: ItemProps) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        ...(surface !== undefined ? { "data-surface": surface } : {}),
        className: cn(itemVariants({ variant, size, className })),
      },
      props
    ),
    render,
    state: {
      slot: "item",
      variant,
      size,
    },
  })
}

const itemMediaVariants = cva(
  "flex shrink-0 items-center justify-center gap-2 [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "[&_svg:not([class*='size-'])]:size-4",
        image: "overflow-hidden [&_img]:size-full [&_img]:object-cover",
      },
      size: {
        default: "",
        // Future sizes:
        // sm: "",
      },
    },
    compoundVariants: [
      {
        variant: "image",
        size: "default",
        class: "size-15 md:size-18 rounded-md",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function ItemMedia({
  className,
  variant = "default",
  size,
  ...props
}: ItemMediaProps) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant, size }), className)}
      {...props}
    />
  )
}

function ItemContent({ className, ...props }: ItemContentProps) {
  return (
    <div
      data-slot="item-content"
      className={cn(
        "flex flex-1 flex-col gap-1 group-data-[size=xs]/item:gap-0 [&+[data-slot=item-content]]:flex-none",
        className
      )}
      {...props}
    />
  )
}

function ItemTitle({ className, ...props }: ItemTitleProps) {
  return (
    <div
      data-slot="item-title"
      className={cn(
        "line-clamp-2 min-w-0 text-left gap-2 underline-offset-4 subhead-sm lg:subhead-lg text-text-primary",
        className
      )}
      {...props}
    />
  )
}

function ItemDescription({ className, ...props }: ItemDescriptionProps) {
  return (
    <p
      data-slot="item-description"
      className={cn(
        "text-left body-sm text-text-secondary group-data-[size=sm]/item:body-sm [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-text-primary",
        className
      )}
      {...props}
    />
  )
}

function ItemActions({ className, ...props }: ItemActionsProps) {
  return (
    <div
      data-slot="item-actions"
      className={cn(
        "flex items-center gap-2 text-text-primary",
        className
      )}
      {...props}
    />
  )
}

function ItemHeader({ className, ...props }: ItemHeaderProps) {
  return (
    <div
      data-slot="item-header"
      className={cn(
        "flex basis-full items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
}

function ItemFooter({ className, ...props }: ItemFooterProps) {
  return (
    <div
      data-slot="item-footer"
      className={cn(
        "flex basis-full items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
}

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
}

export type {
  ItemProps,
  ItemMediaProps,
  ItemContentProps,
  ItemActionsProps,
  ItemGroupProps,
  ItemSeparatorProps,
  ItemTitleProps,
  ItemDescriptionProps,
  ItemHeaderProps,
  ItemFooterProps,
}
