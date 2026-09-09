import { IconToyotaX } from "@ucmp/ui/icons";
import { useId } from "react";
import { cn } from "utils";

/**
 * Toyota X path coordinates — 64×64 artboard, matches toyota-x.tsx exactly.
 */
const TOYOTA_X_PATH =
  "M12.2421 14.4968C11.4239 13.0246 13.0474 11.4019 14.5202 12.2198L21.4342 16.0592C28.012 19.7119 36.0102 19.7119 42.5879 16.0592L49.5021 12.2198C50.9749 11.4019 52.5984 13.0246 51.7801 14.4968L47.9389 21.4079C44.2846 27.9827 44.2846 35.9772 47.9389 42.552L51.7571 49.4216C52.5772 50.897 50.9454 52.5211 49.4728 51.6952L42.7881 47.9459C36.2255 44.2651 28.2268 44.2315 21.6334 47.8569L14.4917 51.7837C13.0187 52.5937 11.4033 50.9723 12.2198 49.5033L16.0834 42.5519C19.7376 35.9771 19.7376 27.9827 16.0834 21.408L12.2421 14.4968Z";

/**
 * Props for the LoadingState component.
 *
 * Two variants are supported:
 * - **brand** (default): spinning brand-colored icon at standard size, with
 *   text truncated via ellipsis.
 * - **origination**: larger icon, background photo clipped to the icon
 *   silhouette — image stays still, only the clip shape rotates.
 *
 * Animation respects `prefers-reduced-motion` via the global
 * `animate-spin-pause` rule in `globals.css`.
 */
export interface LoadingStateProps {
  /**
   * Background image URL for the `"origination"` variant.
   * The image is clipped to the Toyota X shape; it never moves.
   * Ignored when `variant` is `"brand"`.
   */
  backgroundImage?: string;
  /**
   * Alt text for the background image. Defaults to `""` (decorative).
   */
  backgroundImageAlt?: string;
  /** Optional extra classes applied to the root wrapper. */
  className?: string;
  /**
   * Accessible label describing the loading action.
   * Rendered as visible text and used as the `role="status"` accessible name.
   */
  label: string;
  /**
   * Visual variant.
   * - `"brand"` — standard icon size, brand color, ellipsis text.
   * - `"origination"` — larger icon, photo clipped to icon shape, wrapping text.
   * @default "brand"
   */
  variant?: "brand" | "origination";
}

/**
 * Shared loading state — centered spinning icon with a message label.
 *
 * Place inside a container that provides the desired height; the component
 * fills the available space and centers its content.
 *
 * @example Brand variant (default)
 * ```tsx
 * <LoadingState label="Estimating value..." />
 * ```
 *
 * @example Origination variant
 * ```tsx
 * <LoadingState
 *   variant="origination"
 *   label="No hidden fees. Plus 7-day returns and a 90-day warranty."
 *   backgroundImage="/images/origination-car.jpg"
 * />
 * ```
 */
export function LoadingState({
  label,
  variant = "brand",
  backgroundImage,
  backgroundImageAlt = "",
  className,
}: LoadingStateProps) {
  const isOrigination = variant === "origination";
  const clipId = useId();

  return (
    <div
      aria-label={label}
      aria-live="polite"
      className={cn(
        "flex h-full w-full flex-col items-center justify-center bg-surface-secondary",
        className
      )}
      role="status"
    >
      {isOrigination && backgroundImage ? (
        /*
         * Origination variant — all rendering happens inside a single <svg>
         * so the clipPath, the image, and the rotation share one coordinate
         * space and there are no cross-element reference issues.
         *
         * The SVG viewBox is 64×64 (the icon's native artboard).
         * A <clipPath> defines the Toyota X shape. The <path> inside it
         * carries `animate-spin-pause` so only the clip shape rotates —
         * the <image> element below is never transformed and stays still.
         *
         * <image> uses preserveAspectRatio="xMidYMid slice" which is the SVG
         * equivalent of object-fit: cover.
         */
        <svg
          aria-hidden={!backgroundImageAlt}
          className="size-36 shrink-0"
          role="presentation"
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
        >
          {backgroundImageAlt && <title>{backgroundImageAlt}</title>}
          <defs>
            <clipPath id={clipId}>
              {/*
               * This <path> rotates (via animate-spin-pause) around the
               * center of the 64×64 viewBox. The image below is clipped by
               * whatever shape this path describes at any given frame.
               */}
              <path
                className="animate-spin-pause"
                d={TOYOTA_X_PATH}
                style={{ transformOrigin: "32px 32px" }}
              />
            </clipPath>
          </defs>

          {/* Static image — never moves; the clip shape rotates over it */}
          <image
            clipPath={`url(#${clipId})`}
            height="64"
            href={backgroundImage}
            preserveAspectRatio="xMidYMid slice"
            width="64"
            x="0"
            y="0"
          />
        </svg>
      ) : (
        <IconToyotaX aria-hidden className="size-27 animate-spin-pause text-brand" />
      )}

      {/* Label */}
      <p
        className={cn(
          "mt-10 text-center text-text-primary",
          isOrigination ? "body-xl" : "body-md max-w-xs truncate"
        )}
      >
        {label}
      </p>
    </div>
  );
}
