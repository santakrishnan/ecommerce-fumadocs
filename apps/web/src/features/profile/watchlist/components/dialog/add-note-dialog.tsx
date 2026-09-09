"use client";

import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTopBar,
  Field,
  FieldDescription,
  FloatingLabel,
  FloatingTextarea,
} from "@ucmp/ui";
import { useEffect, useId, useState } from "react";

const MAX_NOTE_LENGTH = 500;

export interface AddNoteDialogProps {
  /** Existing note to prefill for edit mode. */
  initialNote?: string;
  /** Called when open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Called when user saves the note. */
  onSaveNote: (note: string) => void;
  /** Control open state externally. */
  open?: boolean;
  /** VIN of the vehicle being annotated. */
  vin: string;
}

/**
 * Add/Edit note dialog for a watchlist vehicle card.
 *
 * Contains a FloatingTextarea with a 500-char counter and a Save button.
 * Save is disabled when empty/whitespace or over the character limit.
 */
export function AddNoteDialog({
  vin: _vin,
  initialNote = "",
  open,
  onOpenChange,
  onSaveNote,
}: AddNoteDialogProps) {
  const [text, setText] = useState(initialNote);
  const textareaId = useId();
  const counterId = useId();

  // Reset text when the dialog opens (controlled) or when initialNote changes while open.
  useEffect(() => {
    if (open) {
      setText(initialNote);
    }
  }, [open, initialNote]);

  const charCount = text.length;
  const isOverLimit = charCount > MAX_NOTE_LENGTH;
  const isEmpty = text.trim().length === 0;
  const isSaveDisabled = isEmpty || isOverLimit;

  const handleSave = () => {
    if (isSaveDisabled) {
      return;
    }
    onSaveNote(text.trim());
    onOpenChange?.(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="lg:w-full" innerClassName="overflow-x-hidden lg:px-10">
        <DialogTopBar className="pt-5 pb-5" />
        <DialogHeader className="gap-2">
          <DialogTitle className="h3">{initialNote ? "Edit note" : "Add note"}</DialogTitle>
          <DialogDescription className="body-sm">
            Notes are private to you and are not shared with the dealer.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="mt-6 flex flex-col gap-3">
          <Field data-invalid={isOverLimit ? "true" : undefined}>
            <Field>
              <FloatingTextarea
                aria-describedby={counterId}
                aria-invalid={isOverLimit || undefined}
                id={textareaId}
                maxLength={MAX_NOTE_LENGTH}
                onChange={(e) => setText(e.target.value)}
                value={text}
              />
              <FloatingLabel htmlFor={textareaId}>Add note</FloatingLabel>
            </Field>
            <FieldDescription
              aria-live="polite"
              className={isOverLimit ? "text-right text-destructive" : "text-right"}
              id={counterId}
            >
              {charCount}/{MAX_NOTE_LENGTH}
            </FieldDescription>
          </Field>
        </DialogBody>

        {/* Save action — pinned to bottom on mobile via mt-auto */}
        <DialogFooter className="mt-auto flex flex-col lg:mt-10">
          <Button
            className="w-full"
            disabled={isSaveDisabled}
            onClick={handleSave}
            size="lg"
            variant="primary"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
