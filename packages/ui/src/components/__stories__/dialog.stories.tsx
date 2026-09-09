import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "@/components/button"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTopBar,
  DialogTrigger,
} from "@/components/dialog"
import { Progress } from "@/components/progress"

/**
 * Dialog — a responsive modal.
 *
 * - Mobile & Tablet (sm/md): full-screen (100vw × 100dvh, edge-to-edge)
 * - Desktop (lg+): vertically centered, max-w-[676px]
 *
 * Overlay: bg-overlay (black/70, no blur).
 * Built on [Base UI Dialog](https://base-ui.com/react/components/dialog).
 *
 * ## DialogTopBar
 * `DialogTopBar` is required as the first child of `DialogContent` to render
 * the close button, custom header elements (progress bars, step counters, back
 * buttons), or to preserve consistent top spacing on mobile/tablet.
 *
 * - `<DialogTopBar />` — renders the default close button (icon-only, right-aligned).
 * - `<DialogTopBar><Custom /></DialogTopBar>` — custom elements left, close button right.
 * - `<DialogTopBar showCloseButton={false} />` — no close button; keeps mobile spacing.
 *
 * When no `DialogTopBar` is provided, `DialogContent` auto-inserts one based on
 * its own `showCloseButton` prop. For full control, always provide your own.
 *
 * ## Breaking change (v2)
 * sm/md breakpoints now render full-screen by default.
 * Consumers relying on the previous bottom-sheet layout at these sizes
 * should add local overrides via className on DialogContent, e.g.:
 * `className="bottom-2.5 left-2.5 right-2.5 w-auto h-auto max-h-[calc(100vh-20px)] rounded-tl-drawer-top rounded-tr-drawer-top rounded-bl-drawer-bottom rounded-br-drawer-bottom md:inset-auto md:bottom-2.5 md:left-2.5 md:right-2.5 md:h-auto md:max-h-[min(850px,calc(100vh-20px))] md:rounded-tl-drawer-top md:rounded-tr-drawer-top md:rounded-bl-drawer-bottom md:rounded-br-drawer-bottom"`
 */
const meta = {
  title: "Components/Dialog",
  component: Dialog,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A responsive modal. Mobile & Tablet (sm/md): full-screen (edge-to-edge). Desktop (lg+): centered, max-w-[676px]. " +
          "Built on [Base UI Dialog](https://base-ui.com/react/components/dialog).",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

/** Basic default dialog with all sub-components. */
export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button>Open Dialog</Button>} />
      <DialogContent>
        <DialogTopBar />
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            This is a basic dialog description.
            When you visit our website, we use cookies and other mechanisms, such as session replay technology, to collect information. The data collected is used to help our website function, learn more about our website users, deliver relevant advertising, enhance user experience, and analyze website performance.


          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

/** No close button — consumer provides dismiss via DialogClose. */
export const NoCloseButton: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button>Open (no X)</Button>} />
      <DialogContent>
        <DialogTopBar showCloseButton={false} />
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>
            Are you sure you want to proceed?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" className="w-full flex-1"/>}>Cancel</DialogClose>
          <Button className="w-full flex-1">Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}


/** Long content scrolls within DialogBody; header and footer stay pinned. */
export const ScrollableBody: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button>Open Scrollable Dialog</Button>} />
      <DialogContent>
        <DialogTopBar />
        <DialogHeader className="mb-8">
          <DialogTitle>Terms &amp; Conditions</DialogTitle>
          <DialogDescription>
            Please read the following terms carefully.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {Array.from({ length: 30 }, (_, i) => (
            <p key={i} className="mb-4 text-sm text-text-primary">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
              ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
              aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
              pariatur.
            </p>
          ))}
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary"/>}>Decline</DialogClose>
          <Button>Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}


/** Everything scrolls together — header and footer scroll with content. Demo variant for comparison. */
export const ScrollWithHeaderFooter: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button>Open (No DialogBody)</Button>} />
      <DialogContent>
        <DialogTopBar />
        <DialogBody>
          <DialogHeader>
            <DialogTitle>Terms &amp; Conditions</DialogTitle>
            <DialogDescription>
              Please read the following terms carefully.
            </DialogDescription>
          </DialogHeader>
          {Array.from({ length: 30 }, (_, i) => (
            <p key={i} className="text-sm text-text-secondary">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
              ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
              aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
              pariatur.
            </p>
          ))}
          <DialogFooter>
            <DialogClose render={<Button variant="secondary">Decline</Button>} />
            <Button>Accept</Button>
          </DialogFooter>
        </DialogBody>
      </DialogContent>
    </Dialog>
  ),
}

/** Full-screen at all breakpoints including desktop.
 * Use the `fullScreen` prop to override the default lg+ centered layout.
 */
export const FullScreen: Story = {
  parameters: {
    chromatic: { viewports: [393, 768, 1440] },
    docs: {
      description: {
        story:
          "When `fullScreen` is set, the dialog fills the entire viewport at **all** breakpoints " +
          "— including desktop (lg+). Useful for immersive flows like media galleries or multi-step wizards.",
      },
    },
  },
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button>Open Full-Screen Dialog</Button>} />
      <DialogContent fullScreen>
        <DialogTopBar />
        <DialogHeader>
          <DialogTitle>Full-Screen Dialog</DialogTitle>
          <DialogDescription>
            This dialog is full-screen at every viewport size, including
            desktop.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-text-secondary">
            The fullScreen prop keeps the dialog edge-to-edge (100vw × 100dvh)
            regardless of breakpoint. Without it, the dialog switches to a
            centered modal at lg (1440px).
          </p>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" className="w-full flex-1">Cancel</Button>} />
          <Button className="w-full flex-1">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

/** Demonstrates `DialogTopBar` with custom children alongside the close button.
 * Use `DialogTopBar` as a child of `DialogContent` to render arbitrary elements in the top bar region.
 * The close button stays visible unless you set `showCloseButton={false}`.
 */
export const CustomTopBar: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Use `DialogTopBar` to place custom elements next to the close button. " +
          "Pass any React node as children. Set `showCloseButton={false}` to hide the default close.",
      },
    },
  },
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button>Open (Custom Top Bar)</Button>} />
      <DialogContent>
        <DialogTopBar className="items-center">
          <Progress value={50} className="w-32" />
        </DialogTopBar>
        <DialogHeader>
          <DialogTitle>Multi-Step Flow</DialogTitle>
          <DialogDescription>
            The top bar shows a progress indicator with the close button on the
            right.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-text-secondary">
            Pass any React node as children of <code>DialogTopBar</code> to render it in the
            top bar region. The close button stays visible unless you set{" "}
            <code>showCloseButton=false</code>. Override the wrapper's styles
            with <code>className</code>.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary">Back</Button>
          <Button>Next</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

/** Shows both the default icon-only close button and a secondary DialogClose with custom children. */
export const CloseVariants: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates both close button variants: the default icon-only `DialogClose` rendered " +
          "automatically via `DialogTopBar`, and a secondary `DialogClose` with custom child text in the footer.",
      },
    },
  },
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button>Open Dialog</Button>} />
      <DialogContent>
        <DialogTopBar />
        <DialogHeader>
          <DialogTitle>Close Variants</DialogTitle>
          <DialogDescription>
            The top-right X is the default DialogClose (icon-only). The footer
            has a secondary DialogClose with a text label as children.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-text-secondary">
            When <code>DialogClose</code> receives <code>children</code>, it
            renders those children instead of the default close icon. This is
            useful for cancel buttons in the footer.
          </p>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button size="sm" variant="tertiary"/>}>Cancel</DialogClose>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

/** No close button and no DialogTopBar — omit DialogTopBar entirely and add
 * top padding directly on DialogContent. Dismiss via footer actions only.
 */
export const NoCloseNoTopBar: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "When no `DialogTopBar` is provided, omit it entirely and apply top padding " +
          "directly via `className` on `DialogContent`. There is no close button — " +
          "users dismiss via the footer actions.",
      },
    },
  },
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button>Open (No Close)</Button>} />
      <DialogContent className="pt-8">
        <DialogHeader>
          <DialogTitle>No Close Button</DialogTitle>
          <DialogDescription>
            No DialogTopBar is rendered. Top spacing comes from{" "}
            <code>className="pt-8"</code> on DialogContent. Dismiss via the
            footer buttons.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-text-secondary">
            Omit <code>DialogTopBar</code> entirely when you don't need a close
            button or custom header content. Add top padding directly on{" "}
            <code>DialogContent</code> to preserve spacing.
          </p>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button size="lg" variant="secondary"/>}>Cancel</DialogClose>
          <Button size="lg">Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

/** Responsive behavior — use the viewport toolbar to verify.
 * - Mobile / SM / MD (below 1440px): full-screen, edge-to-edge, no border radius.
 * - LG+ (1440px and above): centered, max-w-[676px], drawer radii.
 * @see [PEDX01-2285] Dialog full-screen at sm/md breakpoints.
 */
export const Responsive: Story = {
  parameters: {
    chromatic: { viewports: [393, 768, 1440] },
    docs: {
      description: {
        story:
          "Toggle the viewport toolbar between **Mobile (393px)**, **MD (768px)**, and **XL (1440px)** " +
          "to see the responsive breakpoint in action. Below `lg` the dialog is full-screen; at `lg`+ it centers.",
      },
    },
  },
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button>Open Dialog</Button>} />
      <DialogContent>
        <DialogTopBar />
        <DialogHeader>
          <DialogTitle>Responsive Dialog</DialogTitle>
          <DialogDescription>
            Resize with the viewport toolbar to see the layout shift at the lg
            breakpoint (1440px).
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-text-secondary">
            Below lg: full-screen (100vw × 100dvh, edge-to-edge, no radius).
            At lg and above: centered with max-w-[676px] and drawer radii.
          </p>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" className="w-full flex-1"/>}>Cancel</DialogClose>
          <Button className="w-full flex-1">Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}
