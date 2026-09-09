"use client";

import { useRef, useState } from "react";

/** Return type for the useVoiceRecording hook. */
export interface UseVoiceRecordingReturn {
  /** Cancel and discard the current recording. */
  cancelRecording: () => void;
  /** Clear the current error message. */
  clearError: () => void;
  /** Error message if recording failed, null otherwise. */
  error: string | null;
  /** Whether a completed recording exists. */
  hasRecordedAudio: boolean;
  /** Whether the microphone is actively recording. */
  isRecording: boolean;
  /** Start a new recording session. */
  startRecording: () => Promise<void>;
  /** Stop the current recording (keeps the audio). */
  stopRecording: () => void;
  /** Toggle between start and stop. */
  toggleRecording: () => void;
}

/**
 * Hook managing voice recording state via the MediaRecorder API.
 * Handles start, stop, and cancel operations with proper stream cleanup.
 */
export function useVoiceRecording(): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecordedAudio, setHasRecordedAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Voice recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = () => {
        setError("Recording failed. Please try again.");
        cancelRecording();
      };

      mediaRecorder.onstop = () => {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        if (audioChunksRef.current.length > 0) {
          setHasRecordedAudio(true);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setHasRecordedAudio(false);
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setError("Microphone access denied. Please allow microphone access.");
        } else if (err.name === "NotFoundError") {
          setError("No microphone found. Please connect a microphone.");
        } else {
          setError("Failed to access microphone. Please try again.");
        }
      } else {
        setError("Failed to start recording. Please try again.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setHasRecordedAudio(false);
  };

  const toggleRecording = () => (isRecording ? stopRecording() : startRecording());

  const clearError = () => setError(null);

  return {
    cancelRecording,
    clearError,
    error,
    hasRecordedAudio,
    isRecording,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
