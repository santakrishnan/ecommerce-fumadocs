import type React from "react";

import { cn } from "@/lib/utils";

/** Props shared across both image modes. */
interface AspectFillImageBaseProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * Target aspect ratio for the container. Accepts a number (`width / height`)
   * or a string in `"w/h"` format matching Tailwind's `aspect-*` convention
   * (e.g. `"3/4"`, `"16/9"`).
   * @default "3/4"
   */
  aspectRatio?: number | string;
}

/** Provide a custom image element (e.g. `next/image` with `fill`). */
interface AspectFillImageWithElement extends AspectFillImageBaseProps {
  /**
   * Custom image element to render inside the aspect-ratio frame.
   * Must be a `fill`-mode image (e.g. `next/image` with `fill`) or any
   * absolutely positioned element that fills its parent.
   */
  image: React.ReactElement;
  src?: never;
  alt?: never;
  imageClassName?: never;
}

/** Use a default native `<img>` — provide `src` and `alt`. */
interface AspectFillImageWithSrc extends AspectFillImageBaseProps {
  /** Image source URL. */
  src: string;
  /** Alternate text for the image. */
  alt: string;
  /** Classes applied to the native `<img>` element. */
  imageClassName?: string;
  image?: never;
}

export type AspectFillImageProps =
  | AspectFillImageWithElement
  | AspectFillImageWithSrc;

/**
 * Renders an image inside a fixed aspect-ratio container using "aspect fill"
 * (CSS `object-cover`) behaviour — the image fills the entire frame, cropping
 * any overflow while maintaining its intrinsic aspect ratio.
 *
 * Useful for vehicle cards, hero images, and any context where the image must
 * completely fill a predictable bounding box regardless of its source dimensions.
 *
 * @example Native img
 * ```tsx
 * <AspectFillImage src="/car.jpg" alt="2024 Camry" aspectRatio="3/4" />
 * ```
 *
 * @example With next/image (fill mode)
 * ```tsx
 * <AspectFillImage
 *   aspectRatio="3/4"
 *   image={<Image src="/car.jpg" alt="2024 Camry" fill sizes="448px" />}
 * />
 * ```
 */
function AspectFillImage({
  aspectRatio = "3/4",
  className,
  image,
  src,
  alt,
  imageClassName,
  style,
  ...props
}: AspectFillImageProps) {
  const resolvedAspectRatio =
    typeof aspectRatio === "number"
      ? `${aspectRatio}`
      : aspectRatio.replace("/", " / ");

  const imageElement = image ?? (
    <img
      alt={alt ?? ""}
      className={cn("size-full object-cover", imageClassName)}
      data-slot="aspect-fill-image-img"
      loading="lazy"
      src={src ?? ""}
    />
  );

  return (
    <div
      {...props}
      className={cn("relative w-full overflow-hidden", className)}
      data-slot="aspect-fill-image"
      style={{ ...style, aspectRatio: resolvedAspectRatio }}
    >
      {imageElement}
    </div>
  );
}

export { AspectFillImage };
