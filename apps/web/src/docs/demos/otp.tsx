"use client";

import { useOtpFlow } from "@features/auth";
import { OtpStart, OtpVerify } from "@shared/components/otp";
import type { OtpChannelPayload } from "@shared/lib/otp-channel";
import { useState } from "react";
import { cn } from "utils";

function Echo({ label, value }: { label: string; value: string | null }) {
  if (value === null) {
    return null;
  }
  return (
    <p className="body-sm mt-6 rounded-md border border-border bg-muted px-3 py-2 font-mono text-muted-foreground text-xs">
      {label}: {value}
    </p>
  );
}

/** Step one on a light surface, with the submitted channel echoed underneath. */
export function OtpStartDemo() {
  const [payload, setPayload] = useState<OtpChannelPayload | null>(null);

  return (
    <div className="w-full max-w-md">
      <OtpStart
        description="Unlock a smarter, more personalized experience. Get inventory alerts and seamless dealership visits."
        hint="Already a member? Sign in below"
        onSubmit={setPayload}
        title="Become a Toyota iD member today"
      />
      <Echo label="onSubmit" value={payload ? `${payload.type} → ${payload.value}` : null} />
    </div>
  );
}

/** Step one as it appears in the auth overlay: dark surface over an image. */
export function OtpStartDarkDemo() {
  const [payload, setPayload] = useState<OtpChannelPayload | null>(null);

  return (
    <div className="w-full max-w-md rounded-xl bg-black p-8 text-white" data-surface="dark">
      <OtpStart
        className="text-text-primary"
        description="Unlock a smarter, more personalized experience."
        onSubmit={setPayload}
        surface="dark"
        title="Become a Toyota iD member today"
      />
      <Echo label="onSubmit" value={payload ? `${payload.type} → ${payload.value}` : null} />
    </div>
  );
}

/** Step two with resend and verify callbacks echoed. */
export function OtpVerifyDemo() {
  const [code, setCode] = useState<string | null>(null);
  const [resends, setResends] = useState(0);

  return (
    <div className="w-full max-w-md">
      <OtpVerify
        identifier="(***) ***-1234"
        onResend={() => setResends((n) => n + 1)}
        onVerify={setCode}
      />
      <Echo label="onVerify" value={code} />
      <Echo label="onResend calls" value={resends > 0 ? String(resends) : null} />
    </div>
  );
}

/**
 * Both steps sequenced by `useOtpFlow` — the same hook the auth overlay uses,
 * rendered in a plain container instead of the full-screen dialog.
 */
export function OtpFlowDemo() {
  const flow = useOtpFlow();
  const [verified, setVerified] = useState<string | null>(null);

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 flex items-center justify-between text-muted-foreground text-xs">
        <span className="font-mono">step: {flow.step}</span>
        <button
          className={cn("underline underline-offset-4", flow.step === "start" && "invisible")}
          onClick={() => {
            flow.reset();
            setVerified(null);
          }}
          type="button"
        >
          Start over
        </button>
      </div>
      {flow.step === "start" ? (
        <OtpStart
          description="We'll text or email you a one-time code."
          onSubmit={flow.submitChannel}
          title="Sign in"
        />
      ) : (
        <OtpVerify identifier={flow.identifier} onResend={() => undefined} onVerify={setVerified} />
      )}
      <Echo label="verified with code" value={verified} />
    </div>
  );
}
