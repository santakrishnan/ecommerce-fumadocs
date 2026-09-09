import { Button } from "@ucmp/ui";
import { IconArrowRight, IconClose } from "@ucmp/ui/icons";
import type { FormEvent } from "react";
import { WaveformVisualizer } from "./waveform-visualizer";

/** Props for the RecordingBar component. */
interface RecordingBarProps {
  /** Whether a completed recording exists. */
  hasRecordedAudio: boolean;
  /** Whether the microphone is actively recording. */
  isRecording: boolean;
  /** Discard the stopped recording. */
  onCancel: () => void;
  /** Stop the active recording and keep the audio. */
  onStop: () => void;
  /** Submit the form (send the recording). */
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

/**
 * Voice recording bar — replaces the normal search bar while recording.
 *
 * Two states:
 * - Recording (`isRecording = true`): waveform animates; X stops the recording
 *   (keeps audio). Arrow-right is disabled.
 * - Stopped (`hasRecordedAudio = true`): waveform is frozen; X discards the
 *   recording; Arrow-right submits it.
 */
export function RecordingBar({
  hasRecordedAudio,
  isRecording,
  onCancel,
  onStop,
  onSubmit,
}: RecordingBarProps) {
  return (
    <form className="mx-auto w-full" onSubmit={onSubmit}>
      <div className="relative flex h-16 items-center rounded-4xl border border-surface-inactive bg-surface-primary transition-all duration-200 ease-in-out">
        <div className="flex w-full items-center gap-3 px-6 py-2.5">
          <WaveformVisualizer isRecording={isRecording} />
          <Button
            aria-label={isRecording ? "Stop recording" : "Discard recording"}
            className="text-text-primary"
            onClick={isRecording ? onStop : onCancel}
            size="icon-sm"
            surface="dark"
            type="button"
            variant="primary"
          >
            <IconClose className="size-5" />
          </Button>
          <Button
            aria-label="Send recording"
            className="text-text-primary"
            disabled={isRecording || !hasRecordedAudio}
            size="icon-sm"
            surface="dark"
            type="submit"
            variant="primary"
          >
            <IconArrowRight className="size-5" />
          </Button>
        </div>
      </div>
    </form>
  );
}
