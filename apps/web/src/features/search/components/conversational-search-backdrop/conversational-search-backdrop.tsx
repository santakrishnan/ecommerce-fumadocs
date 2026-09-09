import searchBackgroundBlur from "@public/images/backgrounds/search_background_blur.png";
import type { StaticImageData } from "next/image";
import Image from "next/image";

interface ConversationalSearchBackdropProps {
  imageUrl?: string;
}

/**
 * Full-viewport blurred background layer for conversational search results.
 *
 * Behavior:
 * - **No `imageUrl` prop:** renders the pre-blurred fallback with dark overlay only.
 * - **With `imageUrl` prop:** renders the sharp image .
 */
export function ConversationalSearchBackdrop({ imageUrl }: ConversationalSearchBackdropProps) {
  const src: string | StaticImageData = imageUrl ?? searchBackgroundBlur;
  const isStaticFallback = !imageUrl;

  return (
    <>
      {/* Opaque base - immediately covers the viewport to lessen visible flash */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-black" />
      {/* Image layer - fades in over the opaque base */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 animate-search-page-fade-in"
      >
        <Image
          alt="Search background"
          className="object-cover object-top-left 2xl:object-bottom"
          fill
          placeholder={isStaticFallback ? "blur" : "empty"}
          priority
          sizes="100vw"
          src={src}
        />
      </div>
    </>
  );
}
