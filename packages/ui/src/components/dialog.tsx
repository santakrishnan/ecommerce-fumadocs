"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { useMediaQuery } from "@ucmp/shared"

import { cn } from "@/lib/utils"
import { Button } from "@/components/button"
import { IconClose } from "@/icons"

interface DialogProps extends DialogPrimitive.Root.Props {}

function Dialog({ ...props }: DialogProps) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

interface DialogTriggerProps extends DialogPrimitive.Trigger.Props {}

function DialogTrigger({ ...props }: DialogTriggerProps) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

interface DialogPortalProps extends DialogPrimitive.Portal.Props {}

function DialogPortal({ ...props }: DialogPortalProps) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

interface DialogCloseProps extends DialogPrimitive.Close.Props {}

function DialogClose({
  className,
  ...props
}: DialogCloseProps) {
  return (
    <DialogPrimitive.Close
    data-slot="dialog-close"
    className={cn(className)}
    render={
      <Button
        aria-label="Close"
        variant="secondary"
        size="icon-sm"
        className={cn(className)}
      >
        <IconClose className="size-5" />
      </Button>
    }
    {...props}
  />
  )
}

interface DialogOverlayProps extends DialogPrimitive.Backdrop.Props {}

function DialogOverlay({
  className,
  ...props
}: DialogOverlayProps) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        // Layout
        "fixed inset-0 isolate z-50",
        // Appearance
        "bg-overlay",
        // Animation
        "duration-100",
        "data-open:animate-in data-open:fade-in-0",
        "data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

interface DialogTopBarProps extends React.ComponentProps<"div"> {
  showCloseButton?: boolean
}

function DialogTopBar({ className, children, showCloseButton = true, ...props }: DialogTopBarProps) {
  return (
    <div
      data-slot="dialog-top-bar"
      className={cn(
        "box-content flex min-h-14 items-center pb-4 pt-4 lg:pb-6 lg:pt-6",
        children ? "justify-between" : "justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && <DialogClose />}
    </div>
  )
}

interface DialogContentProps extends DialogPrimitive.Popup.Props {
  /** Only affects lg+ breakpoints — mobile/tablet is already full-screen by default */
  fullScreen?: boolean
  /** Additional classes applied to the inner content wrapper (useful for overriding default padding on lg+ modals) */
  innerClassName?: string
  /** Additional classes applied to the backdrop overlay */
  overlayClassName?: string
}

function DialogContent({
  className,
  children,
  fullScreen = false,
  innerClassName,
  overlayClassName,
  ...props
}: DialogContentProps) {
  // The desktop centered modal (non-full-screen at lg+) uses a plain flex
  // wrapper. Every other case (mobile/tablet at any breakpoint, and desktop
  // full-screen) uses a centered, max-width-constrained flex wrapper. Children
  // are rendered exactly once — rendering both wrappers duplicated DOM nodes
  // and ARIA IDs.
  const isDesktopViewport = useMediaQuery("(min-width: 1440px)")
  const shouldRenderDesktopContent = isDesktopViewport && !fullScreen

  return (
    <DialogPortal>
      <DialogOverlay className={overlayClassName} />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          // Layout
          "fixed inset-0 z-50",
          // Sizing
          "w-screen h-dvh max-h-none",
          // Appearance
          "bg-surface-secondary rounded-none outline-none ring-0",
          // Spacing
          "pb-4 lg:pb-8",
          // Animation
          "duration-100",
          "data-open:animate-in data-open:slide-in-from-bottom",
          "data-closed:animate-out data-closed:slide-out-to-bottom",
          // Desktop (lg+) — centered modal
          !fullScreen && [
            "lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2",
            "lg:w-auto lg:h-auto lg:max-w-169",
            "lg:rounded-tl-drawer-top lg:rounded-tr-drawer-top lg:rounded-bl-drawer-bottom lg:rounded-br-drawer-bottom",
          ],
          className
        )}
        {...props}
      >
        {shouldRenderDesktopContent ? (
          <div
            data-slot="dialog-content-inner"
            className={cn(
              // Desktop centered modal (lg+, non-full-screen) — plain flex column.
              // This branch only renders at lg+, so no breakpoint prefixes are needed.
              "flex h-full flex-1 flex-col overflow-y-auto px-10 max-h-[min(700px,calc(100vh-40px))]",
              innerClassName
            )}
          >
            {children}
          </div>
        ) : (
            <div
              data-slot="dialog-content-inner"
              className={cn(
                "overflow-y-auto col-span-full h-full flex flex-1 flex-col px-(--page-grid-margin) max-w-(--container-xl) mx-auto",
                innerClassName
              )}
            >
              {children}
            </div>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

interface DialogBodyProps extends React.ComponentProps<"div"> {}

function DialogBody({ className, ...props }: DialogBodyProps) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        // Layout
        "min-h-0 flex-1",
        // Overflow — hidden scrollbar
        "overflow-y-auto",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
      {...props}
    />
  )
}

interface DialogHeaderProps extends React.ComponentProps<"div"> {}

function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

interface DialogFooterProps extends React.ComponentProps<"div"> {}

function DialogFooter({
  className,
  children,
  ...props
}: DialogFooterProps) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-row items-start justify-start gap-2 mt-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface DialogTitleProps extends DialogPrimitive.Title.Props {}

function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("h1 lg:h2 text-text-primary", className)}
      {...props}
    />
  )
}

interface DialogDescriptionProps extends DialogPrimitive.Description.Props {}

function DialogDescription({
  className,
  ...props
}: DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "body-lg text-text-secondary",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTopBar,
  DialogTrigger,
}

export type {
  DialogBodyProps,
  DialogCloseProps,
  DialogContentProps,
  DialogDescriptionProps,
  DialogFooterProps,
  DialogHeaderProps,
  DialogOverlayProps,
  DialogPortalProps,
  DialogProps,
  DialogTitleProps,
  DialogTopBarProps,
  DialogTriggerProps,
}
