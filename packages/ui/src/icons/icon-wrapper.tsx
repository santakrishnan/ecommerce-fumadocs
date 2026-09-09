import * as React from "react";
import { cn } from "@/lib/utils";
import type { Surface } from "@/lib/types";

export interface IconProps extends React.SVGAttributes<SVGElement> {
  /** Icon size — use Tailwind `size-*` classes instead when possible. */
  size?: number;
  /**
   * Surface context for adaptive colour.
   *
   * When set, emits `data-surface` on the `<svg>` so the icon participates in
   * the same cascade used by `Button`, `Eyebrow`, and other primitives:
   * - `"light"` → resolves `--color-text-*` to their dark-on-light values
   * - `"dark"`  → resolves `--color-text-*` to their light-on-dark values
   *
   * Omitting it leaves the existing behaviour unchanged — colour is inherited
   * from `currentColor` via the nearest ancestor `data-surface` or a `text-*`
   * utility class passed by the caller.
   */
  surface?: Surface;
}

/**
 * Factory that creates a named, surface-aware icon component from SVG children.
 *
 * Each icon renders as an inline `<svg>` with:
 * - `currentColor` inheritance — colour with `text-*` utilities
 * - 20×20 `viewBox` matching the Figma icon frame
 * - `aria-hidden="true"` by default — wrap in a `<button aria-label="…">` for interactive use
 * - `data-slot="icon"` — used as a styling hook by the theme
 * - `data-surface` emitted only when `surface` is set, triggering the token cascade
 *
 * @param displayName - React display name shown in DevTools (e.g. `"IconHome"`)
 * @param path - SVG path(s) or elements rendered inside the `<svg>`
 *
 * @example
 * ```tsx
 * import { IconHome } from "@ucmp/ui/icons";
 *
 * // colour via ancestor cascade or text-* class
 * <IconHome className="size-5 text-text-primary" />
 *
 * // icon declares its own surface — no wrapper needed
 * <IconHome className="size-5 text-text-primary" surface="dark" />
 * ```
 */
export function createIcon(displayName: string, path: React.ReactNode) {
  const Icon = React.forwardRef<SVGSVGElement, IconProps>(
    ({ className, size, surface, ...props }, ref) => (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        width={size}
        height={size}
        fill="none"
        aria-hidden="true"
        data-slot="icon"
        {...(surface !== undefined ? { "data-surface": surface } : {})}
        className={cn("shrink-0", className)}
        {...props}
      >
        {path}
      </svg>
    )
  );
  Icon.displayName = displayName;
  return Icon;
}
