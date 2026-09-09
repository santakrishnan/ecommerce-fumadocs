"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "utils";

/**
 * CompareHeader — wraps children and hides on scroll-down for mobile/tablet only.
 * Desktop (lg+) is unaffected — header always visible.
 */
export function CompareHeader({ children }: { children: React.ReactNode }) {
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    // Only attach scroll listener below lg breakpoint (mobile/tablet).
    const mql = window.matchMedia("(max-width: 1023px)");
    if (!mql.matches) {
      return;
    }

    let rafId: number | null = null;

    function onScroll() {
      if (rafId !== null) {
        return;
      }
      rafId = requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;

        if (Math.abs(delta) > 10) {
          setIsHidden(delta > 0 && currentY > 80);
          lastScrollY.current = currentY;
        }

        rafId = null;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        "max-lg:transition-transform max-lg:duration-300 max-lg:ease-out",
        isHidden && "max-lg:-translate-y-full"
      )}
    >
      {children}
    </div>
  );
}
