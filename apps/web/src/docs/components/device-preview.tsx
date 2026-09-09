"use client";

import { ExternalLinkIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "utils";
import type { DemoName } from "../demos";
import { PREVIEW_HEIGHT_MESSAGE, type PreviewHeightMessage } from "./preview-shell";
import {
  type DeviceId,
  PreviewStage,
  PreviewToolbar,
  toolbarButton,
  useViewport,
} from "./preview-toolbar";
import { type ColorMode, ThemeControls } from "./theme-controls";

export interface DevicePreviewProps {
  /** Brand themes offered by the toolbar (from packages/ui-theme/themes). */
  brands?: string[];
  className?: string;
  defaultDevice?: DeviceId;
  name: DemoName;
}

/**
 * Renders a demo inside an iframe pointed at `/preview/[name]`, so Tailwind's
 * viewport variants (`sm:`, `md:`) and portaled UI (dialogs, the auth overlay)
 * behave exactly as on a device of the selected width. Wider presets are
 * scaled down to fit the docs column.
 */
export function DevicePreview({
  brands,
  className,
  defaultDevice = "desktop",
  name,
}: DevicePreviewProps) {
  const viewport = useViewport(defaultDevice);
  const { containerRef, customWidth, device, deviceId, scale, viewportWidth } = viewport;

  const [heights, setHeights] = useState<Record<number, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [mode, setMode] = useState<ColorMode>("light");
  const [brand, setBrand] = useState(brands?.[0] ?? "default");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // The iframe applies mode/brand from its URL (see PreviewShell), so a change
  // simply reloads it with new params — the docs page itself is unaffected.
  const query = new URLSearchParams();
  if (mode === "dark") {
    query.set("mode", "dark");
  }
  if (brand !== "default") {
    query.set("brand", brand);
  }
  const search = query.toString();
  const src = `/preview/${name}${search ? `?${search}` : ""}`;

  useEffect(() => {
    const onMessage = (event: MessageEvent<PreviewHeightMessage>) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }
      if (event.data?.type !== PREVIEW_HEIGHT_MESSAGE || event.data.name !== name) {
        return;
      }
      const { height } = event.data;
      setHeights((prev) =>
        prev[viewportWidth] === height ? prev : { ...prev, [viewportWidth]: height }
      );
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [name, viewportWidth]);

  const viewportHeight = Math.max(device.height, heights[viewportWidth] ?? 0);
  const framed = device.width !== null || customWidth !== null;

  const reload = () => {
    setLoaded(false);
    setHeights({});
    setReloadKey((k) => k + 1);
  };

  return (
    <div
      className={cn(
        "not-prose my-4 overflow-hidden rounded-xl border border-fd-border bg-fd-background",
        className
      )}
      data-brand={brand}
      data-color-mode={mode}
      data-device={deviceId}
      data-mode="iframe"
    >
      <PreviewToolbar height={viewportHeight} mode="iframe" onReload={reload} viewport={viewport}>
        <ThemeControls
          brand={brand}
          brands={brands}
          mode={mode}
          onBrandChange={(next) => {
            setBrand(next);
            setLoaded(false);
          }}
          onModeChange={(next) => {
            setMode(next);
            setLoaded(false);
          }}
        />
        <a
          aria-label="Open preview in a new tab"
          className={cn(toolbarButton, "size-7 justify-center px-0")}
          href={src}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLinkIcon className="size-3.5" />
        </a>
      </PreviewToolbar>

      <PreviewStage ref={containerRef}>
        <div
          className="relative shrink-0 transition-[width,height] duration-200"
          style={{ width: viewportWidth * scale, height: viewportHeight * scale }}
        >
          {!loaded && (
            <div
              aria-hidden
              className="absolute inset-0 animate-pulse rounded-lg border border-fd-border bg-fd-muted/60"
            />
          )}
          {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: `load` is a lifecycle event, not a user interaction */}
          <iframe
            className={cn(
              "block origin-top-left rounded-lg border border-fd-border bg-fd-background shadow-sm transition-opacity",
              framed && "ring-4 ring-fd-foreground/5",
              loaded ? "opacity-100" : "opacity-0"
            )}
            key={`${reloadKey}:${src}`}
            onLoad={() => setLoaded(true)}
            ref={iframeRef}
            src={src}
            style={{
              width: viewportWidth,
              height: viewportHeight,
              transform: scale < 1 ? `scale(${scale})` : undefined,
            }}
            title={`Live preview of ${name}`}
          />
        </div>
      </PreviewStage>
    </div>
  );
}
