"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

export const PREVIEW_HEIGHT_MESSAGE = "design-system:preview-height";

export interface PreviewHeightMessage {
  height: number;
  name: string;
  type: typeof PREVIEW_HEIGHT_MESSAGE;
}

const BRAND_LINK_ID = "docs-preview-brand";

/**
 * Applies the theme requested by the parent preview through the iframe URL:
 * `?mode=dark` toggles the `.dark` class (the theme's dark token set) on this
 * document only, and `?brand=<name>` links that brand's override stylesheet
 * served by `/preview-brand/[brand]`. Neither touches the parent page.
 */
function applyThemeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const root = document.documentElement;

  root.classList.toggle("dark", params.get("mode") === "dark");

  const brand = params.get("brand");
  const existing = document.getElementById(BRAND_LINK_ID);
  if (!brand || brand === "default") {
    existing?.remove();
    root.removeAttribute("data-brand");
    return;
  }
  root.dataset.brand = brand;
  const href = `/preview-brand/${encodeURIComponent(brand)}`;
  if (existing instanceof HTMLLinkElement && existing.getAttribute("href") === href) {
    return;
  }
  existing?.remove();
  const link = document.createElement("link");
  link.id = BRAND_LINK_ID;
  link.rel = "stylesheet";
  link.href = href;
  document.head.append(link);
}

/**
 * Wraps a demo rendered inside the `/preview/[name]` iframe: applies the
 * requested theme and reports the content height to the parent so the frame
 * can grow with the demo.
 */
export function PreviewShell({ children, name }: { children: ReactNode; name: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyThemeFromUrl();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.parent === window) {
      return;
    }

    const post = () => {
      const message: PreviewHeightMessage = {
        type: PREVIEW_HEIGHT_MESSAGE,
        name,
        height: Math.ceil(el.getBoundingClientRect().height),
      };
      window.parent.postMessage(message, window.location.origin);
    };

    post();
    const observer = new ResizeObserver(post);
    observer.observe(el);
    return () => observer.disconnect();
  }, [name]);

  return (
    <div
      className="flex min-h-svh w-full flex-col items-center justify-center bg-background p-6 text-foreground"
      data-preview={name}
      ref={ref}
    >
      {children}
    </div>
  );
}
