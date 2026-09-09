"use client";

import { Button } from "@ucmp/ui";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "utils";

export interface VehicleDetailStickyCtaProps {
  ariaLabel: string;
  label: string;
}

/**
 * Sticky CTA — duplicates the purchase card button at the bottom of the
 * viewport on mobile when the original scrolls out of view (down only).
 * Portalled to body; hidden on lg: where the rail is already sticky.
 */
export function VehicleDetailStickyCta({ ariaLabel, label }: VehicleDetailStickyCtaProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const hasScrolledPast = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Depends on isMounted so the portal paints opacity-0 before isSticky can
  // flip true — ensures the CSS transition animates on first appearance.
  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) {
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
        } else {
          const rect = sentinel.getBoundingClientRect();
          if (rect.bottom > 0) {
            return; // Not scrolled past yet
          }
          hasScrolledPast.current = true;
          setIsSticky(true);
        }
      },
      { threshold: 0 }
    );
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [isMounted]);

  const ctaButton = (
    <Button
      aria-label={ariaLabel}
      fullWidth
      size="lg"
      surface="dark"
      type="button"
      variant="primary"
    >
      {label}
    </Button>
  );

  return (
    <>
      <div
        aria-hidden={isSticky}
        data-testid="vehicle-detail-cta-sentinel"
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
              "fixed inset-x-0 bottom-0 z-50 px-(--page-grid-margin) pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden",
              "transition-[opacity,transform] duration-300 ease-out motion-reduce:duration-0",
              isSticky ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
            )}
            data-testid="vehicle-detail-cta-sticky"
            inert={!isSticky || undefined}
          >
            {ctaButton}
          </div>,
          document.body
        )}
    </>
  );
}
