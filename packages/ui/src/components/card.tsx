import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { cn } from "@/lib/utils"

/** Shared base classes for Card and PolyCard surfaces. */
const cardClasses = "group/card flex flex-col overflow-clip rounded-xl bg-card text-sm text-card-foreground shadow-xs ring-1 ring-foreground/10 has-[>img:first-child]:pt-0 has-[>img:last-child]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl"

// ─── Card (static div) ──────────────────────────────────────────────

/**
 * Card — a static surface container. Renders a plain `<div>`.
 *
 * Use this for non-interactive cards. For cards that need to render as a
 * link or button, use `PolyCard` with the `render` prop instead.
 */
function Card({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(cardClasses, className)}
      {...props}
    />
  )
}

// ─── PolyCard (polymorphic card) ────────────────────────────────────

interface PolyCardProps extends useRender.ComponentProps<"div"> {}

/**
 * PolyCard — a polymorphic card surface via Base UI's `useRender`.
 *
 * Renders with the shared card classes and emits `data-slot="card"`.
 * Pass a `render` prop to change the underlying element (link, button, etc.).
 * When no `render` is provided, behaves identically to `Card` (static div).
 *
 * No wrapper div, no adornments slot — consumers compose their own DOM
 * structure around it as needed.
 *
 * @example
 * // As a navigable link
 * <PolyCard render={<a href="/detail" aria-label="View details" />} className="p-6">
 *   <CardContent>...</CardContent>
 * </PolyCard>
 *
 * @example
 * // As a button
 * <PolyCard render={<button type="button" onClick={handleClick} />} className="text-left">
 *   <CardContent>...</CardContent>
 * </PolyCard>
 */
function PolyCard({
  className,
  render,
  children,
  ...props
}: PolyCardProps) {
  return useRender({
    render,
    props: mergeProps<"div">(
      {
        className: cn(cardClasses, className),
        children,
      },
      props
    ),
    defaultTagName: "div",
    state: {
      slot: "card",
    },
  })
}

// ─── Subcomponents (shared by both) ─────────────────────────────────

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-sm leading-heading font-bold tracking-tightest md:text-sm lg:text-base xl:text-base",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-xs leading-body tracking-tighter text-muted-foreground md:text-xs lg:text-xs xl:text-xs",
        className
      )}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "px-4 py-5",
        className
      )}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl px-4 [.border-t]:pt-6",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  PolyCard,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
export type { PolyCardProps }
