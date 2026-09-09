import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Base classes for the Eyebrow primitive.
 *
 * Typography uses the `body-sm` variant (12px) per the Toyota Design Library spec.
 * `text-text-primary` is surface-aware and adapts to light/dark contexts
 * automatically via design tokens.
 */
const eyebrowClasses = [
  // Layout
  "inline-flex items-center gap-0.5",
  // Typography — body-sm on mobile, body-md on desktop, surface-aware colour
  "body-sm lg:body-md text-text-primary",
  // Icon sizing — consumers pass a bare <Icon /> with no per-icon size class
  "[&>svg]:pointer-events-none [&>svg]:size-3.5 [&>svg]:shrink-0",
].join(" ");

export interface EyebrowProps extends ComponentProps<"p"> {}

/**
 * Eyebrow — a small inline label with an optional leading icon.
 *
 * Aligned with the
 * [Toyota Design Library — Eyebrow](https://www.figma.com/design/7jjFjOTZe0jmljcXpQXF0A/Toyota-Design-Library?node-id=4482-5945&m=dev).
 *
 * Typography is always Body-Small (12px) per the design spec. Owns only
 * intrinsic styling: layout, gap, type tokens, icon sizing, and
 * `text-text-primary` (surface-aware by design). Contextual positioning
 * (e.g. `mt-2`) stays at the call site via `className`.
 *
 * Pass a bare icon child with no per-icon size class — the primitive sizes it
 * automatically via `[&>svg]:size-3.5`.
 *
 * @example
 * // Editorial card eyebrow (with icon)
 * <Eyebrow>
 *   <IconBinocular />
 *   12 new matches
 * </Eyebrow>
 *
 * @example
 * // Inventory card AI description line
 * <Eyebrow className="mt-2">
 *   <IconToyotaX />
 *   Great fuel economy
 * </Eyebrow>
 */
function Eyebrow({ className, ...props }: EyebrowProps) {
  return <p className={cn(eyebrowClasses, className)} data-slot="eyebrow" {...props} />;
}

export { Eyebrow };
