"use client";

import { useMediaQuery } from "@ucmp/shared";
import { Button } from "@ucmp/ui";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "utils";

export interface StatusCardStickyCtaProps {
  ariaLabel: string;
  label: string;
  searchHref: string;
}

/**
 * Status Card Sticky CTA — portals a fixed bottom bar on mobile (< md)
 * when the inline "Search similar to this" link scrolls out of view.
 *
 * Parallel to VehicleDetailStickyCta; differs in:
 * - CTA is a next/link (not a button)
 * - Hidden at md: (not lg:) — unavailable-vehicle overlay is visible from 768px
 * - Observer is short-circuited on md+ so aria-hidden/inert never
 *   suppress the inline CTA on tablet/desktop viewports.
 */
export function StatusCardStickyCta({ ariaLabel, label, searchHref }: StatusCardStickyCtaProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const hasScrolledPast = useRef(false);
  const isMobile = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    if (!isMobile) {
      hasScrolledPast.current = false;
      setIsSticky(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }

        if (entry.isIntersecting) {
          if (hasScrolledPast.current) {
            setIsSticky(false);
          }
          return;
        }

        const rect = sentinel.getBoundingClientRect();
        if (rect.bottom > 0) {
          return;
        }

        hasScrolledPast.current = true;
        setIsSticky(true);
      },
      { threshold: 0 }
    );
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [isMobile]);

  const ctaButton = (
    <Button
      aria-label={ariaLabel}
      fullWidth
      nativeButton={false}
      render={<Link href={searchHref} />}
      size="lg"
      surface="dark"
      variant="primary"
    >
      {label}
    </Button>
  );

  return (
    <>
      <div
        aria-hidden={isSticky}
        data-testid="sold-card-cta-sentinel"
        inert={isSticky || undefined}
        ref={sentinelRef}
      >
        {ctaButton}
      </div>

      {isMounted &&
        createPortal(
          <div
            aria-hidden={!isSticky}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 px-(--page-grid-margin) pt-3",
              "pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden",
              "transition-[opacity,transform] duration-300 ease-out motion-reduce:duration-0",
              isSticky ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
            )}
            data-testid="sold-card-cta-sticky"
            inert={!isSticky || undefined}
          >
            {ctaButton}
          </div>,
          document.body
        )}
    </>
  );
}
