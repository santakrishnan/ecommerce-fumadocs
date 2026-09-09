"use client";

import { useContactInput } from "@shared/hooks/use-contact-input";
import type { OtpChannelPayload } from "@shared/lib/otp-channel";
import { looksLikePhone } from "@shared/lib/otp-channel";
import type { Surface } from "@ucmp/ui";
import { Button, Field, FieldError, FloatingInput, FloatingLabel } from "@ucmp/ui";
import { cn } from "utils";

export interface OtpStartProps {
  /** Whether the component should auto-focus the input (e.g. when a modal opens) */
  autoFocus?: boolean;
  /** Label for the submit button. Defaults to "Continue". */
  buttonLabel?: string;
  /** Additional className for the root container (use to override gap, padding, etc.) */
  className?: string;
  description: string;
  /** Optional hint text shown between description and input */
  hint?: string;
  onSubmit: (payload: OtpChannelPayload) => void;
  /**
   * Surface context for adaptive color schemes.
   * Pass "dark" when rendered on a dark background (image, overlay).
   * Applied to the container via data-surface attribute.
   */
  surface?: Surface;
  title: string;
}

/**
 * First step of the OTP flow: heading, description, phone/email input, and
 * submit button. Presentational only — the caller supplies the shell (Dialog,
 * full-page overlay, etc.).
 */
export function OtpStart({
  autoFocus = false,
  buttonLabel = "Continue",
  className,
  description,
  hint,
  onSubmit,
  surface,
  title,
}: OtpStartProps) {
  const { value, isValid, error, hasSubmitted, inputRef, handleChange, handleBlur, handleSubmit } =
    useContactInput({ onSubmit });

  return (
    <div
      className={cn("flex w-full flex-col items-center gap-8", className)}
      {...(surface === undefined ? {} : { "data-surface": surface })}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="h1 text-inherit">{title}</h2>
        <p className="body-md text-inherit">{description}</p>
        {hint && <p className="body-md text-inherit">{hint}</p>}
      </div>

      <Field className="relative w-full" data-invalid={hasSubmitted && !!error}>
        <FloatingInput
          aria-describedby={error ? "otp-start-error" : undefined}
          aria-invalid={hasSubmitted && !!error}
          autoCapitalize="off"
          autoComplete={looksLikePhone(value) ? "tel" : "email"}
          autoCorrect="off"
          autoFocus={autoFocus}
          className={surface === "dark" ? "rounded-xl border-0 bg-white shadow-none" : undefined}
          id="otp-start-contact"
          inputMode={looksLikePhone(value) ? "tel" : "email"}
          name="contact"
          onBlur={handleBlur}
          onChange={handleChange}
          ref={inputRef}
          spellCheck={false}
          type="text"
          value={value}
        />
        <FloatingLabel htmlFor="otp-start-contact">Phone number or email</FloatingLabel>
        {error && (
          <FieldError className="px-5" id="otp-start-error">
            {error}
          </FieldError>
        )}
      </Field>

      <div className="w-full">
        <Button
          disabled={!isValid}
          fullWidth
          onClick={handleSubmit}
          size="lg"
          surface="light"
          variant="primary"
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
