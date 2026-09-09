"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { IMAGE_UPLOAD_CONFIG } from "../data/search-prompt";

// ─── Helpers ────────────────────────────────────────────────

/** Validate and create object URLs for image files. */
function processFiles(files: File[], currentCount: number): string[] {
  const newImages: string[] = [];
  const allowedTypes = IMAGE_UPLOAD_CONFIG.ALLOWED_TYPES as readonly string[];

  for (const file of files) {
    if (currentCount + newImages.length >= IMAGE_UPLOAD_CONFIG.MAX_COUNT) {
      break;
    }

    if (!allowedTypes.includes(file.type)) {
      continue;
    }

    if (file.size > IMAGE_UPLOAD_CONFIG.MAX_FILE_SIZE) {
      continue;
    }

    newImages.push(URL.createObjectURL(file));
  }

  return newImages;
}

// ─── No-op handlers (stable references) ────────────────────

const noopDrag = (e: React.DragEvent<HTMLFormElement>) => {
  e.preventDefault();
};
const noopFileChange = () => {
  /* disabled */
};
const noopVoid = () => {
  /* disabled */
};
const noopIndex = (_index: number) => {
  /* disabled */
};

// ─── Return Type ────────────────────────────────────────────

/** Public API returned by useImageAttachment. */
export interface UseImageAttachmentReturn {
  /** Currently attached image object URLs. */
  attachedImages: string[];
  /** Reference to the hidden file input element. */
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  /** Handler for drag enter events on the form. */
  handleDragEnter: (e: React.DragEvent<HTMLFormElement>) => void;
  /** Handler for drag leave events on the form. */
  handleDragLeave: (e: React.DragEvent<HTMLFormElement>) => void;
  /** Handler for drag over events on the form. */
  handleDragOver: (e: React.DragEvent<HTMLFormElement>) => void;
  /** Handler for drop events on the form. */
  handleDrop: (e: React.DragEvent<HTMLFormElement>) => void;
  /** Handler for file input change events. */
  handleFilesSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Whether any images are currently attached. */
  hasImages: boolean;
  /** Whether a file is being dragged over the form. */
  isDragging: boolean;
  /** Opens the native file picker dialog. */
  openFilePicker: () => void;
  /** Removes an image at the given index and revokes its object URL. */
  removeImage: (index: number) => void;
}

// ─── Options ────────────────────────────────────────────────

/** Configuration for useImageAttachment. */
export interface UseImageAttachmentOptions {
  /** When false, the hook no-ops: no event listeners, no state changes. Default: true. */
  enabled?: boolean;
}

// ─── Hook ───────────────────────────────────────────────────

/**
 * Hook managing image attachment state: file picker, drag-and-drop, and removal.
 * Handles object URL lifecycle (creation + revocation) to prevent memory leaks.
 *
 * Pass `{ enabled: false }` to fully disable — no side effects will run and
 * all returned values are inert.
 */
export function useImageAttachment(
  options: UseImageAttachmentOptions = {}
): UseImageAttachmentReturn {
  const { enabled = true } = options;

  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attachedImagesRef = useRef<string[]>(attachedImages);

  // Keep the ref in sync with state
  attachedImagesRef.current = attachedImages;

  const hasImages = attachedImages.length > 0;

  // ─── Cleanup object URLs on unmount ─────────────────────
  useEffect(() => {
    if (!enabled) {
      return;
    }
    return () => {
      for (const url of attachedImagesRef.current) {
        URL.revokeObjectURL(url);
      }
    };
  }, [enabled]);

  // ─── Drag & Drop: prevent browser defaults ─────────────
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener("dragover", preventDefaults);
    document.addEventListener("drop", preventDefaults);

    return () => {
      document.removeEventListener("dragover", preventDefaults);
      document.removeEventListener("drop", preventDefaults);
    };
  }, [enabled]);

  // ─── Early return when disabled ─────────────────────────
  if (!enabled) {
    return {
      attachedImages: [],
      fileInputRef,
      handleDragEnter: noopDrag,
      handleDragLeave: noopDrag,
      handleDragOver: noopDrag,
      handleDrop: noopDrag,
      handleFilesSelected: noopFileChange,
      hasImages: false,
      isDragging: false,
      openFilePicker: noopVoid,
      removeImage: noopIndex,
    };
  }

  // ─── File Picker ────────────────────────────────────────

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!(files && files.length > 0)) {
      return;
    }

    const filesArray = Array.from(files);

    // Clear input value immediately after capturing files
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setAttachedImages((prev) => {
      const newImages = processFiles(filesArray, prev.length);
      return newImages.length > 0 ? [...prev, ...newImages] : prev;
    });
  };

  const removeImage = (index: number) => {
    setAttachedImages((prev) => {
      const removed = prev[index];
      if (removed) {
        URL.revokeObjectURL(removed);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // ─── Drag & Drop Handlers ──────────────────────────────

  const handleDragEnter = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (dragLeaveTimerRef.current) {
      clearTimeout(dragLeaveTimerRef.current);
      dragLeaveTimerRef.current = null;
    }

    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (dragLeaveTimerRef.current) {
      clearTimeout(dragLeaveTimerRef.current);
    }

    const form = e.currentTarget;
    const relatedTarget = e.relatedTarget as Node | null;

    if (!(relatedTarget && form.contains(relatedTarget))) {
      dragLeaveTimerRef.current = setTimeout(() => {
        setIsDragging(false);
        dragLeaveTimerRef.current = null;
      }, IMAGE_UPLOAD_CONFIG.DRAG_LEAVE_DELAY_MS);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";

    if (dragLeaveTimerRef.current) {
      clearTimeout(dragLeaveTimerRef.current);
      dragLeaveTimerRef.current = null;
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (dragLeaveTimerRef.current) {
      clearTimeout(dragLeaveTimerRef.current);
      dragLeaveTimerRef.current = null;
    }

    setIsDragging(false);

    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);

      setAttachedImages((prev) => {
        const newImages = processFiles(filesArray, prev.length);
        return newImages.length > 0 ? [...prev, ...newImages] : prev;
      });
    }
  };

  return {
    attachedImages,
    fileInputRef,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFilesSelected,
    hasImages,
    isDragging,
    openFilePicker,
    removeImage,
  };
}
