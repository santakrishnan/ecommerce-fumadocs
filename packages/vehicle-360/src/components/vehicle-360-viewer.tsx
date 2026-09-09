"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { computeViewportSize, drawFrame, resizeCanvasToContainer } from "../lib/draw-frame";
import { getImageBounds, type ImageBounds } from "../lib/image-bounds";
import {
  extractNext360,
  fetchCompositionManifest,
  parseAspectRatio,
} from "../lib/parse-composition";
import type { PreloadProgress } from "../lib/preload-images";
import { preloadImageBitmaps } from "../lib/preload-images";
import { createSpinController, type SpinController } from "../lib/spin-controller";
import { DEFAULT_PIXELS_PER_FRAME } from "../lib/spin-physics";
import type { SpinImage } from "../types/composition-v3";
import { HotspotOverlay } from "./hotspot-overlay";

const LOADER_FADE_MS = 250;

export interface ViewportLayout {
  height: number;
  imageBounds: ImageBounds;
  width: number;
}

export interface Vehicle360ViewerProps {
  className?: string;
  /** When true the canvas fills its container completely; letterboxing happens inside the canvas rather than around it. Use this when the container already enforces the correct aspect ratio (e.g. inside a 16:9 gallery slot). */
  fillContainer?: boolean;
  /** When set, only hotspots whose `type` matches this value are rendered. Untyped hotspots are excluded. */
  hotspotTypeFilter?: string;
  manifestUrl: string;
  /** Called when the manifest fails to load (e.g. 404 — no 360° data for this VIN). */
  onError?: () => void;
  pixelsPerFrame?: number;
  showHotspots?: boolean;
}

export function Vehicle360Viewer({
  manifestUrl,
  pixelsPerFrame = DEFAULT_PIXELS_PER_FRAME,
  showHotspots = true,
  fillContainer = false,
  onError,
  hotspotTypeFilter,
  className,
}: Vehicle360ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bitmapsRef = useRef<ImageBitmap[]>([]);
  const framesRef = useRef<SpinImage[]>([]);
  const frameIndexRef = useRef(0);
  const spinControllerRef = useRef<SpinController | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartSpinRef = useRef(0);
  const isDraggingRef = useRef(false);
  const aspectRatioRef = useRef(4 / 3);
  const fillContainerRef = useRef(fillContainer);
  const drawScheduledRef = useRef(false);
  const pixelsPerFrameRef = useRef(pixelsPerFrame);
  const loaderFadeTimerRef = useRef<number | null>(null);

  const [loadPhase, setLoadPhase] = useState<"loading" | "ready" | "error">("loading");
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [loaderFadingOut, setLoaderFadingOut] = useState(false);
  const [progress, setProgress] = useState<PreloadProgress>({ loaded: 0, total: 0, failed: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [frames, setFrames] = useState<SpinImage[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [viewportLayout, setViewportLayout] = useState<ViewportLayout | null>(null);
  const [hotspotsEnabled, setHotspotsEnabled] = useState(showHotspots);

  // Keep hotspotsEnabled in sync when the parent toggles the showHotspots prop
  // (e.g. switching between the "360° view" tab and the "Key Features" tab).
  useEffect(() => {
    setHotspotsEnabled(showHotspots);
  }, [showHotspots]);

  pixelsPerFrameRef.current = pixelsPerFrame;
  fillContainerRef.current = fillContainer;

  const measureViewport = useCallback((): ViewportLayout | null => {
    const container = containerRef.current;
    if (!container) {
      return null;
    }

    const { width, height } = fillContainerRef.current
      ? { width: container.clientWidth, height: container.clientHeight }
      : computeViewportSize(container.clientWidth, container.clientHeight, aspectRatioRef.current);

    if (width <= 0 || height <= 0) {
      return null;
    }

    const bitmap = bitmapsRef.current[frameIndexRef.current];
    const imageBounds = bitmap
      ? getImageBounds(bitmap.width, bitmap.height, width, height, fillContainerRef.current)
      : getImageBounds(
          Math.round(width),
          Math.round(height),
          width,
          height,
          fillContainerRef.current
        );

    return { width, height, imageBounds };
  }, []);

  const paintFrame = useCallback((): ViewportLayout | null => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const bitmaps = bitmapsRef.current;
    if (!(canvas && container && bitmaps.length)) {
      return null;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }

    const { width, height } = resizeCanvasToContainer(
      canvas,
      container,
      aspectRatioRef.current,
      fillContainerRef.current
    );

    const bitmap = bitmaps[frameIndexRef.current];
    if (!bitmap) {
      return null;
    }

    drawFrame(context, bitmap, width, height, fillContainerRef.current);

    return {
      width,
      height,
      imageBounds: getImageBounds(
        bitmap.width,
        bitmap.height,
        width,
        height,
        fillContainerRef.current
      ),
    };
  }, []);

  const syncFrameState = useCallback((frameIndex: number) => {
    setCurrentFrameIndex(frameIndex);
  }, []);

  const hideLoader = useCallback(() => {
    if (loaderFadeTimerRef.current !== null) {
      window.clearTimeout(loaderFadeTimerRef.current);
    }

    setLoaderFadingOut(true);
    loaderFadeTimerRef.current = window.setTimeout(() => {
      setLoaderVisible(false);
      setLoaderFadingOut(false);
      loaderFadeTimerRef.current = null;
    }, LOADER_FADE_MS);
  }, []);

  const renderCurrentFrame = useCallback(() => {
    const layout = paintFrame();
    if (layout) {
      setViewportLayout(layout);
    }
  }, [paintFrame]);

  const scheduleDraw = useCallback(() => {
    if (drawScheduledRef.current) {
      return;
    }

    drawScheduledRef.current = true;
    requestAnimationFrame(() => {
      drawScheduledRef.current = false;
      renderCurrentFrame();
    });
  }, [renderCurrentFrame]);

  const handleSpinFrameChange = useCallback(
    (frameIndex: number) => {
      frameIndexRef.current = frameIndex;
      syncFrameState(frameIndex);
      scheduleDraw();
    },
    [scheduleDraw, syncFrameState]
  );

  const initSpinController = useCallback(
    (count: number) => {
      spinControllerRef.current = createSpinController(count, handleSpinFrameChange);
    },
    [handleSpinFrameChange]
  );

  useEffect(() => {
    let cancelled = false;

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: async bootstrap state machine — splitting it would require passing many refs across functions
    async function bootstrap() {
      setLoadPhase("loading");
      setLoaderVisible(true);
      setLoaderFadingOut(false);
      setErrorMessage(null);

      try {
        const manifest = await fetchCompositionManifest(manifestUrl);
        if (cancelled) {
          return;
        }

        const spin = extractNext360(manifest);
        if (!spin) {
          throw new Error('Manifest does not contain a "next360" category');
        }

        aspectRatioRef.current = parseAspectRatio(spin.aspectRatio);
        framesRef.current = spin.frames;
        setFrames(spin.frames);
        setProgress({ loaded: 0, total: spin.frameCount, failed: 0 });

        const measured = measureViewport();
        if (measured) {
          setViewportLayout(measured);
        }

        const urls = spin.frames.map((frame) => frame.src);
        const bitmaps = await preloadImageBitmaps(urls, (nextProgress) => {
          if (!cancelled) {
            setProgress(nextProgress);
          }
        });

        if (cancelled) {
          for (const bitmap of bitmaps) {
            bitmap.close();
          }
          return;
        }

        for (const bitmap of bitmapsRef.current) {
          bitmap.close();
        }
        bitmapsRef.current = bitmaps;
        frameIndexRef.current = 0;
        initSpinController(spin.frameCount);
        spinControllerRef.current?.setPosition(0);
        syncFrameState(0);

        const layout = paintFrame();
        if (cancelled) {
          return;
        }

        if (layout) {
          setViewportLayout(layout);
        }

        setLoadPhase("ready");
        hideLoader();
      } catch (error) {
        if (!cancelled) {
          setLoadPhase("error");
          setLoaderVisible(false);
          setLoaderFadingOut(false);
          setErrorMessage(error instanceof Error ? error.message : "Failed to load 360 view");
          onError?.();
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
      spinControllerRef.current = null;
      for (const bitmap of bitmapsRef.current) {
        bitmap.close();
      }
      bitmapsRef.current = [];
      framesRef.current = [];
      setFrames([]);
    };
  }, [hideLoader, initSpinController, manifestUrl, measureViewport, paintFrame, syncFrameState]);

  useEffect(() => {
    if (loadPhase !== "ready") {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new ResizeObserver(() => {
      const measured = measureViewport();
      if (measured) {
        setViewportLayout(measured);
      }
      scheduleDraw();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [loadPhase, measureViewport, scheduleDraw]);

  useEffect(() => {
    if (loadPhase !== "ready") {
      return;
    }

    const canvas = canvasRef.current;
    const spinController = spinControllerRef.current;
    if (!(canvas && spinController)) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }

      isDraggingRef.current = true;
      dragStartXRef.current = event.clientX;
      dragStartSpinRef.current = spinController.getPosition();
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!(isDraggingRef.current && bitmapsRef.current.length)) {
        return;
      }

      const nextPosition =
        dragStartSpinRef.current +
        (event.clientX - dragStartXRef.current) / pixelsPerFrameRef.current;
      spinController.setPosition(nextPosition);
    };

    const endDrag = (event: PointerEvent) => {
      if (!isDraggingRef.current) {
        return;
      }

      isDraggingRef.current = false;
      canvas.style.cursor = "";

      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }

      spinController.release();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endDrag);
      canvas.removeEventListener("pointercancel", endDrag);
    };
  }, [loadPhase]);

  useEffect(
    () => () => {
      if (loaderFadeTimerRef.current !== null) {
        window.clearTimeout(loaderFadeTimerRef.current);
      }
    },
    []
  );

  const progressPercent =
    progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0;

  const currentHotspots = frames[currentFrameIndex]?.hotspots ?? [];
  const filteredHotspots = hotspotTypeFilter
    ? currentHotspots.filter((h) => h.type === hotspotTypeFilter)
    : currentHotspots;
  const visibleHotspots = hotspotsEnabled ? filteredHotspots : [];
  const showLoader = loaderVisible && loadPhase !== "error";

  return (
    <div className={["flex w-full flex-col gap-3", className].filter(Boolean).join(" ")}>
      <div
        className="relative flex h-full min-h-[300px] w-full touch-none select-none items-center justify-center overflow-hidden"
        ref={containerRef}
      >
        <div
          className="relative shrink-0"
          style={(() => {
            if (fillContainer) {
              return { position: "absolute" as const, inset: 0 };
            }
            if (viewportLayout) {
              return { width: `${viewportLayout.width}px`, height: `${viewportLayout.height}px` };
            }
            return;
          })()}
        >
          <canvas
            aria-label="360 degree vehicle view. Click and drag horizontally to rotate."
            className="block cursor-grab touch-none"
            ref={canvasRef}
            role="img"
          />

          {loadPhase === "ready" && viewportLayout && visibleHotspots.length > 0 && (
            <HotspotOverlay hotspots={visibleHotspots} imageBounds={viewportLayout.imageBounds} />
          )}
        </div>

        {showLoader && (
          <div
            aria-busy={loadPhase === "loading"}
            aria-live="polite"
            className={[
              "pointer-events-auto absolute inset-0 grid place-items-center bg-black/60 p-6 transition-opacity duration-[250ms] ease-in-out motion-reduce:transition-none",
              loaderFadingOut ? "pointer-events-none opacity-0" : "opacity-100",
            ]
              .filter(Boolean)
              .join(" ")}
            data-surface="dark"
          >
            <div className="flex w-[min(100%,320px)] flex-col items-center gap-3 text-center">
              <div className="size-10 animate-spin rounded-full border-[3px] border-white/20 border-t-white motion-reduce:animate-none" />
              <p className="m-0 font-semibold text-[0.95rem] text-text-primary">
                Loading 360 view…
              </p>
              <div className="flex min-h-9 w-full flex-col gap-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="linear h-full rounded-[inherit] bg-white transition-[width] duration-[120ms] motion-reduce:transition-none"
                    style={{ width: progress.total > 0 ? `${progressPercent}%` : "0%" }}
                  />
                </div>
                <p className="m-0 text-[0.85rem] text-text-secondary">
                  {progress.total > 0
                    ? `${progress.loaded} / ${progress.total} frames (${progressPercent}%)`
                    : "\u00A0"}
                </p>
              </div>
            </div>
          </div>
        )}

        {loadPhase === "error" && (
          <div className="absolute inset-0 grid place-items-center bg-black/60 p-6 text-red-300">
            <p>{errorMessage ?? "Unable to load 360 view"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
