"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "utils";
import { type DemoName, demos } from "../demos";
import { type DeviceId, PreviewStage, PreviewToolbar, useViewport } from "./preview-toolbar";

export interface InlinePreviewProps {
  className?: string;
  defaultDevice?: DeviceId;
  name: DemoName;
}

/**
 * Renders a demo directly in the page inside a div with
 * `container-type: inline-size`, so Tailwind *container* variants (`@md:`)
 * respond to the selected width. Viewport variants (`md:`) and portaled UI
 * do not — use the iframe mode for those.
 */
export function InlinePreview({ className, defaultDevice = "desktop", name }: InlinePreviewProps) {
  const viewport = useViewport(defaultDevice);
  const { containerRef, customWidth, device, deviceId, scale, viewportWidth } = viewport;
  const [reloadKey, setReloadKey] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);

  const Demo = demos[name];

  useEffect(() => {
    const el = frameRef.current;
    if (!el) {
      return;
    }
    const update = () =>
      setContentHeight(Math.ceil(el.getBoundingClientRect().height / (scale || 1)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [scale]);

  const minHeight = Math.round(device.height / 2);
  const frameHeight = Math.max(minHeight, contentHeight);
  const framed = device.width !== null || customWidth !== null;

  return (
    <div
      className={cn(
        "not-prose my-4 overflow-hidden rounded-xl border border-fd-border bg-fd-background",
        className
      )}
      data-device={deviceId}
      data-mode="inline"
    >
      <PreviewToolbar
        height={frameHeight}
        mode="container"
        onReload={() => setReloadKey((k) => k + 1)}
        viewport={viewport}
      />

      <PreviewStage ref={containerRef}>
        <div
          className="relative shrink-0 transition-[width,height] duration-200"
          style={{ width: viewportWidth * scale, height: frameHeight * scale }}
        >
          <div
            className={cn(
              "@container/preview flex origin-top-left flex-col items-center justify-center rounded-lg border border-fd-border bg-background p-6 text-foreground shadow-sm",
              framed && "ring-4 ring-fd-foreground/5"
            )}
            key={reloadKey}
            ref={frameRef}
            style={{
              width: viewportWidth,
              minHeight,
              containerType: "inline-size",
              transform: scale < 1 ? `scale(${scale})` : undefined,
            }}
          >
            <Demo />
          </div>
        </div>
      </PreviewStage>
    </div>
  );
}
