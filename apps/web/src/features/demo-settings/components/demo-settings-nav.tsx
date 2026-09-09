"use client";

import { IconToyotaX } from "@ucmp/ui/icons";
import { useEffect, useRef, useState } from "react";
import { cn } from "utils";

export const DEMO_SETTINGS_SECTIONS = [
  { id: "section-visitor-identity", label: "Visitor identity" },
  { id: "section-search-agent-backend", label: "Search agent backend" },
  { id: "section-profile-tier", label: "Profile: tier" },
  { id: "section-skip-auth", label: "Profile: skip auth" },
  { id: "section-appointment-card-variant", label: "Profile: appointment card variant" },
  { id: "section-trade-in-vehicle-count", label: "Profile: trade-in vehicle count" },
  { id: "section-watchlist-vehicle-count", label: "Profile: watchlist vehicle count" },
  { id: "section-vdp-booking-state", label: "VDP: test drive booking state" },
] as const;

// px from viewport top — last section whose top crosses this line wins
const TRIGGER_OFFSET = 160;

function getActiveSectionId(): string {
  let current: string = DEMO_SETTINGS_SECTIONS[0].id;
  for (const section of DEMO_SETTINGS_SECTIONS) {
    const el = document.getElementById(section.id);
    if (!el) {
      continue;
    }
    if (el.getBoundingClientRect().top <= TRIGGER_OFFSET) {
      current = section.id;
    }
  }
  return current;
}

export function DemoSettingsNav() {
  const [activeId, setActiveId] = useState<string>(DEMO_SETTINGS_SECTIONS[0].id);
  // Suppress scroll-spy during programmatic scroll to avoid flicker
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function handleScroll() {
      if (isProgrammaticScrollRef.current) {
        return;
      }

      // Force-activate the last section when the page can't scroll further
      const nearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50;
      if (nearBottom) {
        const lastSection = DEMO_SETTINGS_SECTIONS.at(-1);
        if (lastSection) {
          setActiveId(lastSection.id);
        }
        return;
      }

      setActiveId(getActiveSectionId());
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  function handleNavClick(id: string) {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }

    isProgrammaticScrollRef.current = true;
    setActiveId(id);
    el.scrollIntoView({ behavior: "smooth", block: "start" });

    clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 800);
  }

  return (
    <nav aria-label="Demo settings sections">
      <ul className="flex flex-col">
        {DEMO_SETTINGS_SECTIONS.map((section) => {
          const isActive = activeId === section.id;
          return (
            <li key={section.id}>
              <button
                aria-current={isActive ? "location" : undefined}
                className="flex w-full items-center gap-2 py-2.5 text-left transition-colors"
                onClick={() => handleNavClick(section.id)}
                type="button"
              >
                {/* Fixed-width slot keeps label position stable */}
                <span className="flex size-4 shrink-0 items-center justify-center">
                  {isActive && <IconToyotaX aria-hidden className="size-4 text-text-primary" />}
                </span>
                <span
                  className={cn(
                    "text-sm leading-snug transition-colors",
                    isActive
                      ? "font-semibold text-text-primary"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  {section.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
