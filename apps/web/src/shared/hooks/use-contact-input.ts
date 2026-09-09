"use client";

import type { OtpChannelPayload } from "@shared/lib/otp-channel";
import {
  detectOtpChannelType,
  formatPhoneInput,
  getOtpChannelValidationError,
  isValidOtpChannelInput,
  looksLikePhone,
  normalizeOtpChannelInput,
} from "@shared/lib/otp-channel";
import { useRef, useState } from "react";

const PHONE_FORMATTED_PATTERN = /^\d[\d-]*$/;

export interface UseContactInputReturn {
  error: string | null;
  handleBlur: () => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => void;
  hasSubmitted: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isValid: boolean;
  reset: () => void;
  value: string;
}

interface UseContactInputOptions {
  onSubmit: (payload: OtpChannelPayload) => void;
}

/**
 * Manages contact input state for the OTP start flow: auto-detection
 * (email vs phone), phone formatting, validation, and submission.
 */
export function useContactInput({ onSubmit }: UseContactInputOptions): UseContactInputReturn {
  const [value, setValue] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValid = isValidOtpChannelInput(value);
  const error = hasSubmitted ? getOtpChannelValidationError(value) : null;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const isDeleting = raw.length < value.length;

    if (looksLikePhone(raw)) {
      // Skip formatting on backspace — let user delete freely
      if (isDeleting) {
        setValue(raw);
      } else {
        setValue(formatPhoneInput(raw));
      }
    } else {
      // When transitioning from phone mode to email mode (user added a letter),
      // strip the dashes that were inserted by phone formatting.
      // Only strip if the previous value was phone-formatted (digits + dashes only).
      const wasPhoneFormatted = PHONE_FORMATTED_PATTERN.test(value);
      setValue(wasPhoneFormatted ? raw.replace(/-/g, "") : raw);
    }
    setHasSubmitted(false);
  }

  function handleBlur() {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    if (looksLikePhone(trimmed)) {
      setValue(formatPhoneInput(trimmed));
    } else {
      setValue(normalizeOtpChannelInput(trimmed));
    }
    setHasSubmitted(true);
  }

  function handleSubmit() {
    setHasSubmitted(true);
    const trimmed = value.trim();
    if (!isValidOtpChannelInput(trimmed)) {
      return;
    }
    onSubmit({
      type: detectOtpChannelType(trimmed),
      value: normalizeOtpChannelInput(trimmed),
    });
  }

  function reset() {
    setValue("");
    setHasSubmitted(false);
  }

  return {
    error,
    handleBlur,
    handleChange,
    handleSubmit,
    hasSubmitted,
    inputRef,
    isValid,
    reset,
    value,
  };
}
