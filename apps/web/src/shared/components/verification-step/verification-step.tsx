"use client";

import { Button, InputOTP, InputOTPGroup, InputOTPSlot, REGEXP_ONLY_DIGITS } from "@ucmp/ui";
import { useState } from "react";

interface VerificationStepProps {
  contactDisplay: string;
  isSubmitting?: boolean;
  onVerify: () => void;
}

const OTP_SLOT_INDICES = [0, 1, 2, 3, 4, 5] as const;

function VerificationStep({
  contactDisplay,
  isSubmitting = false,
  onVerify,
}: VerificationStepProps) {
  const [code, setCode] = useState("");
  const isComplete = code.length === 6;

  function handleResend() {
    // TODO: wire real SMS when OTP service is available — the demo accepts any 6-digit code.
    setCode("");
  }

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div className="flex flex-col gap-2">
        <h2 className="h3 text-text-primary">Enter verification code</h2>
        <p className="body-md text-text-secondary">
          Please enter the code sent to {contactDisplay}.
        </p>
      </div>

      <InputOTP maxLength={6} onChange={setCode} pattern={REGEXP_ONLY_DIGITS} value={code}>
        <InputOTPGroup className="gap-1">
          {OTP_SLOT_INDICES.map((index) => (
            <InputOTPSlot
              className="h-18 w-14.25 rounded-[14px] border border-neutral-200 bg-white text-2xl text-neutral-800"
              index={index}
              key={`otp-slot-${String(index)}`}
            />
          ))}
        </InputOTPGroup>
      </InputOTP>

      <p className="link-text text-text-primary">
        <span>Didn&apos;t get a code? </span>
        <button className="underline hover:opacity-80" onClick={handleResend} type="button">
          Resend
        </button>
      </p>

      <Button
        className="h-14 w-full"
        disabled={!isComplete || isSubmitting}
        fullWidth
        onClick={onVerify}
        size="lg"
        variant="primary"
      >
        Continue
      </Button>
    </div>
  );
}

export { VerificationStep };
