"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "utils";

export interface CompareNavigationSection {
  id: string;
  title: string;
}

export interface CompareNavigationProps {
  sections: CompareNavigationSection[];
}

export function CompareNavigation({ sections }: CompareNavigationProps) {
  const firstId = sections[0]?.id ?? "";
  const [activeId, setActiveId] = useState(firstId);
  const [settled, setSettled] = useState(false);
  const isProgrammaticScrollRef = useRef(false);

  // Trigger gap compression after mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) {
          return;
        }

        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-30% 0px -80% 0px", threshold: 0 }
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) {
        observer.observe(el);
      }
    }

    return () => observer.disconnect();
  }, [sections]);

  function handleClick(id: string) {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }

    setActiveId(id);
    isProgrammaticScrollRef.current = true;

    const offset = 180;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });

    // Re-enable observer tracking once scroll ends.
    // Fallback timeout for browsers without scrollend support.
    const reset = () => {
      isProgrammaticScrollRef.current = false;
    };
    document.addEventListener("scrollend", reset, { once: true });
    setTimeout(reset, 1000);
  }

  return (
    <ul
      className={cn(
        "flex flex-col transition-[gap] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        settled ? "gap-3" : "gap-10"
      )}
    >
      {sections.map((section) => (
        <li key={section.id}>
          <button
            className={cn(
              "carousel-headline cursor-pointer border-none bg-transparent p-0 text-left",
              activeId === section.id
                ? "text-text-primary"
                : "text-text-muted transition-colors hover:text-text-primary"
            )}
            onClick={() => handleClick(section.id)}
            type="button"
          >
            {section.title}
          </button>
        </li>
      ))}
    </ul>
  );
}
