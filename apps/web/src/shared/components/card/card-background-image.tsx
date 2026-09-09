import { AspectFillImage } from "@ucmp/ui";
import Image from "next/image";
import { cn } from "utils";

export interface CardBackgroundImageProps {
  /** Image alt text. Use "" for decorative images where the card link provides context. */
  alt: string;
  /**
   * Aspect ratio for the image container. When provided, renders inside an
   * `AspectFillImage` wrapper that constrains dimensions via CSS `aspect-ratio`.
   * Accepts `"w/h"` strings (e.g. `"3/4"`) or numeric values.
   *
   * When omitted (default), renders a `fill`-mode `next/image` positioned
   * absolutely — the legacy behaviour for overlay cards with external sizing.
   */
  aspectRatio?: number | string;
  /** Additional classes on the image element (e.g. object-contain). */
  className?: string;
  /** Mark as LCP image — loads eagerly without lazy loading. */
  priority?: boolean;
  /** Responsive sizes hint for srcset selection. Defaults to "100vw". */
  sizes?: string;
  /** Image source URL. */
  src: string;
  /** Inline styles (e.g. for view-transition-name). */
  style?: React.CSSProperties;
}

/**
 * Full-bleed background image for overlay cards.
 *
 * Two rendering modes:
 * 1. **Fill mode (default)** — `next/image` with `fill` + `object-cover`.
 *    Must be placed inside a positioned parent (`relative` on the card surface).
 * 2. **Aspect-fill mode** — when `aspectRatio` is provided, wraps the image in
 *    an `AspectFillImage` container that self-sizes via CSS `aspect-ratio`.
 *    Ideal for grid layouts where the card derives its dimensions from content.
 */
export function CardBackgroundImage({
  alt,
  aspectRatio,
  className,
  priority,
  sizes = "100vw",
  src,
  style,
}: CardBackgroundImageProps) {
  if (aspectRatio != null) {
    return (
      <AspectFillImage
        aspectRatio={aspectRatio}
        className={cn("absolute inset-0", className)}
        image={
          <Image
            alt={alt}
            className="object-cover"
            fill
            priority={priority}
            sizes={sizes}
            src={src}
            style={style}
          />
        }
      />
    );
  }

  return (
    <Image
      alt={alt}
      className={cn("object-cover", className)}
      fill
      priority={priority}
      sizes={sizes}
      src={src}
      style={style}
    />
  );
}
