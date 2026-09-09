import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"

import { cn } from "@/lib/utils"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

/**
 * Accordion — a set of collapsible panels.
 *
 * ## Open behavior (`multiple` prop)
 *
 * By default (without `multiple`), only one panel can be open at a time.
 * Opening a new panel automatically closes the previously open one.
 * This is the correct behavior for mobile footers and space-constrained UIs.
 *
 * Pass `multiple` to allow more than one panel to be open simultaneously:
 *
 * ```tsx
 * // Single open (default) — one at a time
 * <Accordion defaultValue={[]}>...</Accordion>
 *
 * // Multiple open — any combination
 * <Accordion multiple defaultValue={["item-1", "item-2"]}>...</Accordion>
 * ```
 *
 * ## Controlled state
 *
 * Use `value` + `onValueChange` for controlled behavior.
 * Each `AccordionItem` also exposes `onOpenChange` for per-item tracking.
 *
 * ## Styling
 *
 * The trigger is intentionally agnostic to font size, weight, color, and
 * text-transform. These vary by context, so pass them via `className`.
 * Children is a ReactNode — compose badges, icons, or any content inline:
 *
 * ```tsx
 * <AccordionTrigger className="text-sm font-bold uppercase">
 *   MODEL <span className="font-normal normal-case text-text-subtle">1</span>
 * </AccordionTrigger>
 *
 * <AccordionTrigger className="text-base font-normal">
 *   Vehicles
 * </AccordionTrigger>
 * ```
 *
 * ## Context-agnostic styling
 *
 * The accordion inherits text/border colors from its parent via semantic
 * tokens. Consumers control the visual context by styling the wrapper.
 */
function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  )
}

function AccordionItem({
  className,
  ...props
}: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-t border-divider", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger flex flex-1 items-center justify-between py-8 aria-expanded:pb-5 text-left text-sm text-text-primary font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-disabled:pointer-events-none aria-disabled:opacity-50",
          className
        )}
        {...props}
      >
        <span>{children}</span>
        <ChevronDownIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none size-5 shrink-0 transition-transform group-aria-expanded/accordion-trigger:hidden"
        />
        <ChevronUpIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none hidden size-5 shrink-0 transition-transform group-aria-expanded/accordion-trigger:inline"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="overflow-hidden text-sm text-text-primary data-open:animate-accordion-down data-closed:animate-accordion-up"
      {...props}
    >
      <div
        className={cn(
          "h-(--accordion-panel-height) pb-8 data-ending-style:h-0 data-starting-style:h-0",
          className
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
