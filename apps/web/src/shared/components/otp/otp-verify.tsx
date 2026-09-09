"use client";

import { Button, InputOTP, InputOTPGroup, InputOTPSlot, REGEXP_ONLY_DIGITS } from "@ucmp/ui";
import { useState } from "react";

const VERIFICATION_CODE_LENGTH = 6;
const OTP_SLOT_INDICES = Array.from({ length: VERIFICATION_CODE_LENGTH }, (_, i) => i);

interface OtpVerifyProps {
  className?: string;
  continueLabel?: string;
  description?: string;
  /** The email or phone number to display in the description. */
  identifier: string;
  onResend?: () => void;
  onVerify: (code: string) => void;
  resendLabel?: string;
  resendPrompt?: string;
  surface?: "dark" | "light";
  title?: string;
}

function OtpVerify({
  className,
  continueLabel = "Continue",
  description = "Please enter the code sent to {identifier}.",
  identifier,
  onVerify,
  onResend,
  resendPrompt = "Didn\u2019t get a code? ",
  resendLabel = "Resend",
  surface,
  title = "Enter verification code",
}: OtpVerifyProps) {
  const [otpValue, setOtpValue] = useState("");
  const isComplete = otpValue.length === VERIFICATION_CODE_LENGTH;
  const resolvedDescription = description.replace("{identifier}", identifier);

  function handleResend() {
    setOtpValue("");
    onResend?.();
  }

  function handleContinue() {
    if (isComplete) {
      onVerify(otpValue);
    }
  }

  return (
    <div className={className} data-slot="otp-verify">
      <div className="flex w-full flex-col items-center gap-4 text-center">
        <h2 className="h1">{title}</h2>
        <p className="body-md opacity-70">{resolvedDescription}</p>
      </div>

      <div className="mt-8 flex flex-col items-center gap-8">
        <InputOTP
          aria-label="Verification code"
          autoComplete="one-time-code"
          autoFocus
          maxLength={VERIFICATION_CODE_LENGTH}
          onChange={setOtpValue}
          pattern={REGEXP_ONLY_DIGITS}
          value={otpValue}
        >
          <InputOTPGroup>
            {OTP_SLOT_INDICES.map((i) => (
              <InputOTPSlot index={i} key={`otp-slot-${String(i)}`} />
            ))}
          </InputOTPGroup>
        </InputOTP>

        <p className="link-text">
          <span>{resendPrompt}</span>
          <Button onClick={handleResend} surface={surface} variant="text">
            {resendLabel}
          </Button>
        </p>

        <div className="w-full max-w-md">
          <Button
            className="w-full"
            disabled={!isComplete}
            onClick={handleContinue}
            size="lg"
            surface="light"
            variant="primary"
          >
            {continueLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { OtpVerifyProps };
export { OtpVerify };
