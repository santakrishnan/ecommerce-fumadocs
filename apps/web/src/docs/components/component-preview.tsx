import type { ReactNode } from "react";
import { cn } from "utils";
import { listBrands } from "../brands";
import type { DemoName } from "../demos";
import { DevicePreview } from "./device-preview";
import { InlinePreview } from "./inline-preview";
import type { DeviceId } from "./preview-toolbar";

export type PreviewMode = "iframe" | "inline";

export interface ComponentPreviewProps {
  align?: "center" | "start";
  children?: ReactNode;
  className?: string;
  /** Initial device when `name` is used. */
  defaultDevice?: DeviceId;
  /**
   * `iframe` (default): true viewport — media queries and portals behave as
   * on a device. `inline`: resizable container div — only `@md:`-style
   * container variants respond.
   */
  mode?: PreviewMode;
  /** Registered demo name (see `src/docs/demos`). Omit for a static frame. */
  name?: DemoName;
}

/**
 * Frame used in the design-system docs to render a live component.
 *
 *   <ComponentPreview name="otp-start" />                  // iframe (default)
 *   <ComponentPreview name="otp-start" mode="inline" />    // container query
 *   <ComponentPreview><Badge>New</Badge></ComponentPreview> // static
 */
export function ComponentPreview({
  align = "center",
  children,
  className,
  defaultDevice,
  mode = "iframe",
  name,
}: ComponentPreviewProps) {
  if (name) {
    if (mode === "inline") {
      return <InlinePreview className={className} defaultDevice={defaultDevice} name={name} />;
    }
    return (
      <DevicePreview
        brands={listBrands()}
        className={className}
        defaultDevice={defaultDevice}
        name={name}
      />
    );
  }

  return (
    <div
      className={cn(
        "not-prose relative my-4 flex min-h-56 w-full items-center overflow-hidden rounded-xl border border-fd-border bg-[radial-gradient(var(--color-fd-border)_1px,transparent_1px)] bg-[size:16px_16px] bg-fd-background p-8",
        align === "center" ? "justify-center" : "justify-start",
        className
      )}
    >
      {children}
    </div>
  );
}
