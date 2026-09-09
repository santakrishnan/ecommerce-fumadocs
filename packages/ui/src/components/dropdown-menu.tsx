"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"

import { cn } from "@/lib/utils"
import {IconCaretRight} from "@/icons";

interface DropdownMenuProps extends MenuPrimitive.Root.Props {}

function DropdownMenu({ ...props }: DropdownMenuProps) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

interface DropdownMenuPortalProps extends MenuPrimitive.Portal.Props {}

function DropdownMenuPortal({ ...props }: DropdownMenuPortalProps) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
}

interface DropdownMenuTriggerProps extends MenuPrimitive.Trigger.Props {}

function DropdownMenuTrigger({ ...props }: DropdownMenuTriggerProps) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

interface DropdownMenuContentProps
  extends MenuPrimitive.Popup.Props,
    Pick<MenuPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset"> {
  fullWidthItems?: boolean
}

interface DropdownMenuContentContextValue {
  fullWidthItems: boolean
}

const DropdownMenuContentContext = React.createContext<DropdownMenuContentContextValue>({
  fullWidthItems: false,
})

function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  fullWidthItems,
  className,
  ...props
}: DropdownMenuContentProps) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <DropdownMenuContentContext value={{ fullWidthItems: Boolean(fullWidthItems) }}>
          <MenuPrimitive.Popup
            data-slot="dropdown-menu-content"
            data-full-width-items={fullWidthItems}
            className={cn(
            // Sizing and layout
            "z-50 max-h-(--available-height) w-(--anchor-width)",
            "min-w-42 origin-(--transform-origin)",
            "overflow-x-hidden overflow-y-auto",
            // Surface and elevation
            "rounded-xl bg-surface-primary text-text-primary-light shadow-dropdown",
            fullWidthItems ? "p-0" : "p-2",
            // Motion baseline
            "duration-100 outline-none",
            // Directional enter transitions
            "data-[side=bottom]:slide-in-from-top-2",
            "data-[side=inline-end]:slide-in-from-left-2",
            "data-[side=inline-start]:slide-in-from-right-2",
            "data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2",
            "data-[side=top]:slide-in-from-bottom-2",
            // Open / close state animations
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95",
              className
            )}
            {...props}
          />
        </DropdownMenuContentContext>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

interface DropdownMenuGroupProps extends MenuPrimitive.Group.Props {}

function DropdownMenuGroup({ ...props }: DropdownMenuGroupProps) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

interface DropdownMenuLabelProps extends MenuPrimitive.GroupLabel.Props {
  inset?: boolean
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: DropdownMenuLabelProps) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 disclaimer font-medium text-text-secondary-light data-inset:pl-8",
        className
      )}
      {...props}
    />
  )
}

interface DropdownMenuItemProps extends MenuPrimitive.Item.Props {
  inset?: boolean
  variant?: "default" | "destructive"
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: DropdownMenuItemProps) {
  const { fullWidthItems } = React.use(DropdownMenuContentContext)

  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        // Layout and spacing
        "group/dropdown-menu-item relative flex cursor-default items-center gap-2",
        "px-5 py-4",
        fullWidthItems ? "rounded-none" : "rounded-md",
        // Typography
        "body-sm text-text-primary-light",
        // Base interaction behavior
        "outline-hidden select-none",
        "focus:bg-secondary focus:text-text-primary-light",
        "hover:bg-secondary",
        // State variants
        "data-inset:pl-8",
        "data-[variant=destructive]:text-destructive",
        "not-data-[variant=destructive]:focus:**:text-text-primary-light",
        "data-[variant=destructive]:focus:bg-destructive/10",
        "data-[variant=destructive]:focus:text-destructive",
        "dark:data-[variant=destructive]:focus:bg-destructive/20",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        // Nested icon defaults
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        "[&_svg:not([class*='size-'])]:size-4",
        "data-[variant=destructive]:*:[svg]:text-destructive",
        className
      )}
      {...props}
    />
  )
}

interface DropdownMenuSubProps extends MenuPrimitive.SubmenuRoot.Props {}

function DropdownMenuSub({ ...props }: DropdownMenuSubProps) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
}

interface DropdownMenuSubTriggerProps extends MenuPrimitive.SubmenuTrigger.Props {
  inset?: boolean
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: DropdownMenuSubTriggerProps) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        // Layout and spacing
        "flex cursor-default items-center gap-2",
        "rounded-sm px-2 py-1.5 text-sm",
        // Base interaction behavior
        "outline-hidden select-none",
        "focus:bg-accent focus:text-accent-foreground",
        "not-data-[variant=destructive]:focus:**:text-accent-foreground",
        // State variants
        "data-inset:pl-8",
        "data-popup-open:bg-accent data-popup-open:text-accent-foreground",
        "data-open:bg-accent data-open:text-accent-foreground",
        // Nested icon defaults
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        "[&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <IconCaretRight className="ml-auto" />
    </MenuPrimitive.SubmenuTrigger>
  )
}

interface DropdownMenuSubContentProps extends DropdownMenuContentProps {}

function DropdownMenuSubContent({
  align = "start",
  alignOffset = -3,
  side = "right",
  sideOffset = 0,
  className,
  ...props
}: DropdownMenuSubContentProps) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        // Sizing and shape
        "w-auto min-w-24 rounded-md",
        // Surface and spacing
        "bg-popover p-1 text-popover-foreground",
        // Depth and border treatment
        "shadow-lg ring-1 ring-foreground/10",
        // Motion baseline
        "duration-100",
        // Directional enter transitions
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",
        // Open / close state animations
        "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
        "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        className
      )}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  )
}

interface DropdownMenuCheckboxItemProps extends MenuPrimitive.CheckboxItem.Props {
  inset?: boolean
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: DropdownMenuCheckboxItemProps) {
  const { fullWidthItems } = React.use(DropdownMenuContentContext)

  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        // Layout and spacing
        "relative flex cursor-default items-center gap-2",
        "px-5 py-4",
        fullWidthItems ? "rounded-none" : "rounded-md",
        // Typography
        "body-sm text-text-primary-light",
        // Base interaction behavior
        "outline-hidden select-none",
        "focus:bg-secondary focus:text-text-primary-light",
        "hover:bg-secondary",
        // State variants
        "data-checked:bg-secondary",
        "data-inset:pl-8",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        // Nested icon defaults
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        "[&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      {children}
    </MenuPrimitive.CheckboxItem>
  )
}

interface DropdownMenuRadioGroupProps extends MenuPrimitive.RadioGroup.Props {}

function DropdownMenuRadioGroup({ ...props }: DropdownMenuRadioGroupProps) {
  return (
    <MenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}


interface DropdownMenuRadioItemProps extends MenuPrimitive.RadioItem.Props {
  inset?: boolean
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: DropdownMenuRadioItemProps) {
  const { fullWidthItems } = React.use(DropdownMenuContentContext)

  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(
        // Layout and spacing
        "relative flex cursor-default items-center gap-2",
        "px-5 py-4",
        fullWidthItems ? "rounded-none" : "rounded-md",
        // Typography
        "body-sm text-text-primary-light",
        // Base interaction behavior
        "outline-hidden select-none",
        "focus:bg-secondary focus:text-text-primary-light",
        "hover:bg-secondary",
        // State variants
        "data-checked:bg-secondary",
        "data-inset:pl-8",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        // Nested icon defaults
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        "[&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
    </MenuPrimitive.RadioItem>
  )
}

interface DropdownMenuSeparatorProps extends MenuPrimitive.Separator.Props {}

function DropdownMenuSeparator({
  className,
  ...props
}: DropdownMenuSeparatorProps) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("my-1 h-px bg-divider-light", className)}
      {...props}
    />
  )
}

interface DropdownMenuShortcutProps extends React.ComponentProps<"span"> {}

function DropdownMenuShortcut({
  className,
  ...props
}: DropdownMenuShortcutProps) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}

export type {
  DropdownMenuProps,
  DropdownMenuPortalProps,
  DropdownMenuTriggerProps,
  DropdownMenuContentProps,
  DropdownMenuGroupProps,
  DropdownMenuLabelProps,
  DropdownMenuItemProps,
  DropdownMenuSubProps,
  DropdownMenuSubTriggerProps,
  DropdownMenuSubContentProps,
  DropdownMenuCheckboxItemProps,
  DropdownMenuRadioGroupProps,
  DropdownMenuRadioItemProps,
  DropdownMenuSeparatorProps,
  DropdownMenuShortcutProps,
}
