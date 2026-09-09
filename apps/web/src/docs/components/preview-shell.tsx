"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

export const PREVIEW_HEIGHT_MESSAGE = "design-system:preview-height";

export interface PreviewHeightMessage {
  height: number;
  name: string;
  type: typeof PREVIEW_HEIGHT_MESSAGE;
}

/**
 * Wraps a demo rendered inside the `/preview/[name]` iframe and reports its
 * content height to the parent document so the frame can grow with the demo.
 */
export function PreviewShell({ children, name }: { children: ReactNode; name: string }) {
  const ref = useRef<HTMLDivElement>(null);

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
