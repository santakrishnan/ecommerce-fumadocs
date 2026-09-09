"use client";

import { useScrollProgress } from "@features/vehicle-detail/hooks/use-scroll-progress";
import { VDP_HERO_READY_ATTR } from "@shared/components/shared-hero-transition/config";
import { DEFAULT_BOTTOM_COLOR_CSS, sampleBottomAverageColor } from "@ucmp/ui";
import Image from "next/image";
import type { CSSProperties, SyntheticEvent } from "react";
import { useEffect, useRef, useState } from "react";

interface HeroBackgroundProps {
  /** Alt text for the hero image. */
  alt?: string;
  /** Source URL for the hero image. */
  src: string;
  /** Optional CSS view transition name for shared-element morphing. */
  viewTransitionName?: string;
}

export function HeroBackground({
  src,
  alt = "Vehicle hero background",
  viewTransitionName,
}: HeroBackgroundProps) {
  const progress = useScrollProgress({ start: 0, endDesktop: 500, endMobile: 280 });
  const [sampledColor, setSampledColor] = useState<string | undefined>(undefined);
  const imgRef = useRef<HTMLImageElement>(null);
  const readySignaledRef = useRef(false);

  function signalHeroReady(image: HTMLImageElement | null) {
    if (readySignaledRef.current) {
      return;
    }
    readySignaledRef.current = true;
    if (image && image.naturalWidth > 0 && image.naturalHeight > 0) {
      setSampledColor(sampleBottomAverageColor(image));
    }
    document.documentElement.setAttribute(VDP_HERO_READY_ATTR, "true");
  }

  // Signal hero-ready only after the image has loaded so the transition
  // overlay doesn't reveal to a grey placeholder on slow networks.
  function handleImageLoad(event: SyntheticEvent<HTMLImageElement>) {
    signalHeroReady(event.currentTarget);
  }

  // Also signal ready on error so the overlay doesn't stay stuck forever
  // if the image fails to load (404, network drop, etc.).
  function handleImageError() {
    signalHeroReady(null);
  }

  // On mount, the browser may have already decoded the image from cache
  // (e.g. reopening the same VIN's VDP) before React attaches the onLoad
  // handler above, so `load` never fires again for this <img>. Detect that
  // case via `complete`/`naturalWidth` and signal ready immediately instead
  // of waiting for the transition provider's safety-net timeout.
  useEffect(() => {
    const image = imgRef.current;
    if (image?.complete && image.naturalWidth > 0) {
      signalHeroReady(image);
    }
    // Reset the per-mount guard and clean up the readiness signal on unmount.
    return () => {
      readySignaledRef.current = false;
      document.documentElement.removeAttribute(VDP_HERO_READY_ATTR);
    };
  }, []);

  // Mobile: subtle zoom from 1.0 → 1.06 via CSS variable
  const mobileScale = 1 + progress * 0.06;

  // Keep the gradient visible until the blur overlay is opaque enough to mask
  // the solid color block below the image. The gradient fades from 1 → 0.3
  // across the first 60% of scroll, then continues smoothly from 0.3 → 0
  // over the remaining 40%.
  const gradientOpacity = progress < 0.6 ? 1 - progress * (0.7 / 0.6) : 0.75 * (1 - progress);

  const gradientColor = sampledColor ?? DEFAULT_BOTTOM_COLOR_CSS;

  return (
    <div
      className="absolute inset-0"
      style={
        {
          "--hero-mobile-scale": mobileScale,
          "--hero-gradient-color": gradientColor,
        } as CSSProperties
      }
    >
      {/* Solid background — fills the full viewport, uses sampled color when available */}
      <div aria-hidden="true" className="absolute inset-0 bg-(--hero-gradient-color)" />

      {/* Sharp hero image — aspect-ratio container on mobile, full viewport on desktop */}
      <div
        className="absolute inset-x-0 top-0 aspect-video scale-[var(--hero-mobile-scale)] overflow-hidden will-change-transform lg:inset-0 lg:aspect-auto lg:scale-100 lg:will-change-auto"
        style={{ viewTransitionName }}
      >
        <Image
          alt={alt}
          className="object-cover object-center"
          fill
          onError={handleImageError}
          onLoad={handleImageLoad}
          priority
          ref={imgRef}
          sizes="100vw"
          src={src}
        />

        {/* Gradient shade over image — fades out as blur fades in */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[25%] bg-[linear-gradient(to_bottom,_oklch(0.6268_0_0/0)_0%,_var(--hero-gradient-color)_60%)] will-change-[opacity] lg:h-[35%] lg:bg-[linear-gradient(to_bottom,_oklch(0.6268_0_0/0)_0%,_var(--hero-gradient-color)_40%)]"
          style={{ opacity: gradientOpacity }}
        />
      </div>

      {/* Blurred image — desktop only, fades in on scroll */}
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden overflow-hidden will-change-[opacity] lg:block"
        style={{ opacity: progress }}
      >
        <Image
          alt=""
          className="scale-110 object-cover object-center blur-[50px]"
          fill
          sizes="100vw"
          src={src}
        />
        {/* Dark tint over blurred image — rgba(0,0,0,0.28) per Figma */}
        <div className="absolute inset-0 bg-black/28" />
      </div>

      {/* Backdrop-blur overlay — mobile only, fades in on scroll */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/40 backdrop-blur-2xl will-change-[opacity] lg:hidden"
        style={{ opacity: progress }}
      />
    </div>
  );
}
