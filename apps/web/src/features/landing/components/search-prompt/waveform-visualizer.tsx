"use client";

import { useEffect, useState } from "react";
import { WAVEFORM_CONFIG } from "../../data/search-prompt";

const INITIAL_BARS = Array.from<number>({ length: WAVEFORM_CONFIG.BAR_COUNT }).fill(
  WAVEFORM_CONFIG.MIN_HEIGHT
);

/** Props for the WaveformVisualizer component. */
interface WaveformVisualizerProps {
  /** Whether the microphone is actively recording. */
  isRecording: boolean;
}

/** Animated waveform visualizer displayed during voice recording. */
export function WaveformVisualizer({ isRecording }: WaveformVisualizerProps) {
  const [bars, setBars] = useState<number[]>(INITIAL_BARS);

  useEffect(() => {
    if (!isRecording) {
      setBars(INITIAL_BARS);
      return;
    }

    const interval = setInterval(() => {
      setBars((prev) =>
        prev.map(() => Math.random() * WAVEFORM_CONFIG.MAX_AMPLITUDE + WAVEFORM_CONFIG.MIN_HEIGHT)
      );
    }, WAVEFORM_CONFIG.ANIMATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <div aria-hidden="true" className="flex h-8 flex-1 items-center justify-center gap-0.5">
      {bars.map((height, index) => (
        <div
          className="w-0.5 rounded-full bg-text-primary transition-all duration-100"
          key={`bar-${String(index)}`}
          // Dynamic bar height driven by random animation — inline style required
          style={{ height: `${String(height)}px` }}
        />
      ))}
    </div>
  );
}
