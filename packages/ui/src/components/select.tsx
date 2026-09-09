"use client"

import * as React from "react"
import {
  Select as SelectPrimitive,
  type SelectRootProps,
  type SelectRootChangeEventDetails,
} from "@base-ui/react/select"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { IconCaretDown, IconCaretUp, IconCheckmark } from "@/icons"

// Internal context for floating-label support
const FloatingSelectContext = React.createContext<{
  open: boolean
  hasValue: boolean
}>({ open: false, hasValue: false })

interface SelectProps<Value = string> extends SelectRootProps<Value, false> {}

function Select<Value = string>({
  value,
  defaultValue,
  disabled,
  onValueChange,
  onOpenChange,
  defaultOpen,
  open: controlledOpen,
  children,
  ...props
}: SelectProps<Value>) {
  const [internalValue, setInternalValue] = React.useState<Value | "">(defaultValue ?? ("" as Value | ""))
  const [open, setOpen] = React.useState(defaultOpen ?? false)

  const handleValueChange = React.useCallback(
    (newValue: Value | null, eventDetails: SelectRootChangeEventDetails) => {
      setInternalValue(newValue ?? ("" as Value | ""))
      onValueChange?.(newValue, eventDetails)
    },
    [onValueChange]
  )

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean, eventDetails: SelectRootChangeEventDetails) => {
      setOpen(nextOpen)
      onOpenChange?.(nextOpen, eventDetails)
    },
    [onOpenChange]
  )

  const currentValue = value !== undefined ? value : internalValue
  const hasValue = currentValue != null && String(currentValue) !== ""
  // When open is controlled via prop, use it; otherwise use internal state
  const effectiveOpen = controlledOpen !== undefined ? controlledOpen : open

  return (
    <div
      data-slot="select"
      data-disabled={disabled ? "" : undefined}
      data-value={currentValue != null ? String(currentValue) : ""}
      data-floating={effectiveOpen || hasValue ? "" : undefined}
      className="peer/select"
    >
      <FloatingSelectContext.Provider value={{ open: effectiveOpen, hasValue }}>
        <SelectPrimitive.Root
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          onValueChange={handleValueChange}
          open={controlledOpen}
          defaultOpen={defaultOpen}
          onOpenChange={handleOpenChange}
          {...props}
        >
          {children}
        </SelectPrimitive.Root>
      </FloatingSelectContext.Provider>
    </div>
  )
}

interface SelectGroupProps extends SelectPrimitive.Group.Props {}

function SelectGroup({ className, ...props }: SelectGroupProps) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

interface SelectValueProps extends SelectPrimitive.Value.Props {}

function SelectValue({ className, ...props }: SelectValueProps) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left", className)}
      {...props}
    />
  )
}

interface SelectTriggerProps extends SelectPrimitive.Trigger.Props {}

function SelectTrigger({
  className,
  children,
  ...props
}: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        // Layout
        "flex w-full items-center justify-between gap-1.5",
        // Size & shape
        "h-9 rounded-lg border border-input bg-neutral-50 px-5 py-2 body-sm text-text-primary-light",
        // Behavior
        "shadow-none transition-[color,box-shadow] outline-none whitespace-nowrap",
        // Focus
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-inactive disabled:text-text-inactive-light",
        // Invalid
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        // Placeholder
        "data-placeholder:text-text-secondary-light disabled:data-placeholder:text-text-inactive-light",
        // Value display
        "*:data-[slot=select-value]:flex",
        "*:data-[slot=select-value]:items-center",
        "*:data-[slot=select-value]:gap-1.5",
        "*:data-[slot=select-value]:flex-1",
        "*:data-[slot=select-value]:text-left",
        // Dark mode
        "dark:bg-input/30",
        "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        // Icon
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-text-primary-light",
        "disabled:[&_svg]:text-text-inactive-light [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span data-slot="select-trigger-value" className="line-clamp-1 w-full">
        {children}
      </span>
      <SelectPrimitive.Icon
        render={
          <span>
            <IconCaretDown className="size-4" />
          </span>
        }
      />
    </SelectPrimitive.Trigger>
  )
}

interface FloatingSelectTriggerProps extends SelectPrimitive.Trigger.Props,
  VariantProps<typeof floatingSelectTriggerVariants> {}

const floatingSelectTriggerVariants = cva(
  [
    // Override height/padding for floating label
    "relative h-18 pt-8.5 pb-4 rounded-xl pr-9",
    // Hide placeholder at rest, show when floating
    "data-placeholder:text-transparent disabled:data-placeholder:text-transparent",
    "data-placeholder:data-floating:text-text-secondary-light",
    // Reposition chevron to vertical center (asymmetric padding breaks flex centering)
    "[&_svg]:absolute [&_svg]:top-1/2 [&_svg]:right-5 [&_svg]:-translate-y-1/2",
  ],
  {
    variants: {
      variant: {
        default: "border-neutral-50 disabled:border-surface-inactive",
        outlined: [
          "border-surface-secondary bg-surface-primary",
          "disabled:border-surface-secondary",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function FloatingSelectTrigger({
  className,
  children,
  variant,
  ...props
}: FloatingSelectTriggerProps) {
  const { open, hasValue } = React.useContext(FloatingSelectContext)
  const shouldFloat = open || hasValue

  return (
    <SelectTrigger
      data-floating={shouldFloat ? "" : undefined}
      className={cn(
        floatingSelectTriggerVariants({ variant }),
        className
      )}
      {...props}
    >
      {children}
    </SelectTrigger>
  )
}

interface SelectContentProps extends SelectPrimitive.Popup.Props,
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  > {}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn("relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

interface SelectLabelProps extends SelectPrimitive.GroupLabel.Props {}

function SelectLabel({
  className,
  ...props
}: SelectLabelProps) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

interface SelectItemProps extends SelectPrimitive.Item.Props {}

function SelectItem({
  className,
  children,
  ...props
}: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 body-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <IconCheckmark className="pointer-events-none" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

interface SelectSeparatorProps extends SelectPrimitive.Separator.Props {}

function SelectSeparator({
  className,
  ...props
}: SelectSeparatorProps) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

interface SelectScrollUpButtonProps extends React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow> {}

function SelectScrollUpButton({
  className,
  ...props
}: SelectScrollUpButtonProps) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <IconCaretUp className="text-primary-light"/>
    </SelectPrimitive.ScrollUpArrow>
  )
}

interface SelectScrollDownButtonProps extends React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow> {}

function SelectScrollDownButton({
  className,
  ...props
}: SelectScrollDownButtonProps) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <IconCaretDown className="text-primary-light"/>
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  FloatingSelectContext,
  FloatingSelectTrigger,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}

export type {
  SelectProps,
  SelectTriggerProps,
  FloatingSelectTriggerProps,
  SelectContentProps,
  SelectGroupProps,
  SelectValueProps,
  SelectLabelProps,
  SelectItemProps,
  SelectSeparatorProps,
  SelectScrollUpButtonProps,
  SelectScrollDownButtonProps,
}
