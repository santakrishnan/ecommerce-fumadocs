"use client";

import { MonitorIcon, RotateCcwIcon, SmartphoneIcon, TabletIcon } from "lucide-react";
import type { ComponentType, ReactNode, Ref } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "utils";

export type DeviceId = "mobile" | "tablet" | "desktop";

export interface Device {
  height: number;
  icon: ComponentType<{ className?: string }>;
  id: DeviceId;
  label: string;
  /** Viewport width in CSS px. `null` = fill the available width. */
  width: number | null;
}

/** Presets on the far side of Tailwind's breakpoints: 390 < sm, 768 = md, desktop ≥ lg. */
export const DEVICES: Device[] = [
  { id: "mobile", label: "Mobile", width: 390, height: 720, icon: SmartphoneIcon },
  { id: "tablet", label: "Tablet", width: 768, height: 860, icon: TabletIcon },
  { id: "desktop", label: "Desktop", width: null, height: 600, icon: MonitorIcon },
];

const MIN_CUSTOM_WIDTH = 280;
const MAX_CUSTOM_WIDTH = 2560;

const FALLBACK_DEVICE = DEVICES[2] as Device;

/** Shared viewport state for both preview modes. */
export function useViewport(defaultDevice: DeviceId) {
  const [deviceId, setDeviceId] = useState<DeviceId>(defaultDevice);
  const [customWidth, setCustomWidth] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const device = DEVICES.find((d) => d.id === deviceId) ?? FALLBACK_DEVICE;
  const viewportWidth = customWidth ?? device.width ?? containerWidth;
  const scale =
    containerWidth > 0 && viewportWidth > containerWidth ? containerWidth / viewportWidth : 1;

  const selectDevice = (id: DeviceId) => {
    setDeviceId(id);
    setCustomWidth(null);
  };

  return {
    containerRef,
    containerWidth,
    customWidth,
    device,
    deviceId,
    scale,
    selectDevice,
    setCustomWidth,
    viewportWidth,
  };
}

export type Viewport = ReturnType<typeof useViewport>;

const toolbarButton =
  "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors " +
  "text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground " +
  "aria-pressed:bg-fd-accent aria-pressed:text-fd-accent-foreground " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring";

export interface PreviewToolbarProps {
  children?: ReactNode;
  height: number;
  /** Badge describing how the preview is rendered, e.g. "iframe" or "container". */
  mode: string;
  onReload?: () => void;
  viewport: Viewport;
}

export function PreviewToolbar({
  children,
  height,
  mode,
  onReload,
  viewport,
}: PreviewToolbarProps) {
  const { customWidth, deviceId, scale, selectDevice, setCustomWidth, viewportWidth } = viewport;

  return (
    <div className="flex flex-wrap items-center gap-2 border-fd-border border-b bg-fd-muted/40 px-2 py-1.5">
      <fieldset aria-label="Preview device" className="flex items-center gap-0.5">
        {DEVICES.map((d) => {
          const active = d.id === deviceId && customWidth === null;
          return (
            <button
              aria-pressed={active}
              className={toolbarButton}
              key={d.id}
              onClick={() => selectDevice(d.id)}
              type="button"
            >
              <d.icon className="size-3.5" />
              <span className="hidden sm:inline">{d.label}</span>
            </button>
          );
        })}
      </fieldset>

      <span
        className="rounded-md border border-fd-border px-1.5 py-0.5 font-mono text-[10px] text-fd-muted-foreground uppercase tracking-wide"
        title="How the preview is rendered"
      >
        {mode}
      </span>

      <div className="ml-auto flex items-center gap-2 text-fd-muted-foreground text-xs tabular-nums">
        <label className="flex items-center gap-1">
          <span className="sr-only sm:not-sr-only">Width</span>
          <input
            aria-label="Custom viewport width in pixels"
            className="h-7 w-[4.5rem] rounded-md border border-fd-border bg-fd-background px-1.5 text-right text-fd-foreground text-xs outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
            max={MAX_CUSTOM_WIDTH}
            min={MIN_CUSTOM_WIDTH}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (Number.isFinite(next) && next >= MIN_CUSTOM_WIDTH) {
                setCustomWidth(next);
              }
            }}
            step={10}
            type="number"
            value={Math.round(viewportWidth) || ""}
          />
          <span>px</span>
        </label>
        <span aria-live="polite">
          {Math.round(viewportWidth)} × {height}
          {scale < 1 && (
            <span className="ml-1 text-fd-muted-foreground/70">· {Math.round(scale * 100)}%</span>
          )}
        </span>
        {onReload && (
          <button
            aria-label="Reload preview"
            className={cn(toolbarButton, "size-7 justify-center px-0")}
            onClick={onReload}
            type="button"
          >
            <RotateCcwIcon className="size-3.5" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export { toolbarButton };

/** Dot-grid stage shared by both modes. */
export function PreviewStage({ children, ref }: { children: ReactNode; ref: Ref<HTMLDivElement> }) {
  return (
    <div
      className="relative flex w-full justify-center overflow-hidden bg-[radial-gradient(var(--color-fd-border)_1px,transparent_1px)] bg-[size:16px_16px] p-4"
      ref={ref}
    >
      {children}
    </div>
  );
}
