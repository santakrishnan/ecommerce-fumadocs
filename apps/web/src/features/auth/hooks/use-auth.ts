"use client";

import { SKIP_AUTH_COOKIE } from "@config/skip-auth";
import { maskOtpChannel, type OtpChannelPayload } from "@shared/lib/otp-channel";
import { useState } from "react";
import { type AuthGateRequest, useAuthContext } from "../auth-provider";

/** Proof the visitor has presented. Mirrors authMetadata flags. */
export type AuthEvidence = "otp" | "passkey";

/** Assurance level: 0 anonymous, 1 OTP (1FA), 2 passkey (2FA). */
export type AcrLevel = 0 | 1 | 2;

export interface AuthRequirement {
  acr: AcrLevel;
  /** All listed evidence must be present. */
  evidence?: AuthEvidence[];
}

export interface VisitorAuth {
  acr: AcrLevel;
  evidence: AuthEvidence[];
}

export type OtpFlowStep = "start" | "verify";

export interface OtpFlow {
  /** Masked channel to show on the verify step (e.g. "(***) ***-1234"); empty on start. */
  identifier: string;
  /** Return to the start step and forget the channel. */
  reset: () => void;
  /** Which step to render: the channel input ("start") or the code input ("verify"). */
  step: OtpFlowStep;
  /** Move to the verify step, remembering the channel the user entered. */
  submitChannel: (channel: OtpChannelPayload) => void;
}

function meetsRequirement(visitor: VisitorAuth, req: AuthRequirement): boolean {
  if (visitor.acr < req.acr) {
    return false;
  }
  for (const proof of req.evidence ?? []) {
    if (!visitor.evidence.includes(proof)) {
      return false;
    }
  }
  return true;
}

/**
 * Demo state, cookie-driven: default → fully verified (gates off, like
 * develop); `demo-skip-auth=false` → anonymous (gates fire). Swap this body
 * for real authMetadata (/resolve) when the assurance layer lands.
 */
function readVisitorAuth(): VisitorAuth {
  const skip =
    typeof document === "undefined" || !document.cookie.includes(`${SKIP_AUTH_COOKIE}=false`);
  return skip ? { acr: 2, evidence: ["otp", "passkey"] } : { acr: 0, evidence: [] };
}

/**
 * Checks a requirement and can raise the OTP overlay. It does not decide
 * whether a gate fires — the caller checks, then hard-gates, soft-suggests,
 * or ignores.
 */
export function useAuth() {
  const { requestAuth } = useAuthContext();

  return {
    otpFlow: useOtpFlow(),
    meetsRequirement: (requirement: AuthRequirement) =>
      meetsRequirement(readVisitorAuth(), requirement),
    showOtpOverlay: (request: AuthGateRequest) => requestAuth(request),
  };
}

/**
 * Sequences the two OTP steps and remembers the channel from step one so the
 * verify step can show a masked identifier. No overlay, modal, or routing —
 * render OtpStart or OtpVerify based on `step`, in any container.
 *
 * @example
 * const otp = useOtpFlow();
 * return otp.step === "start"
 *   ? <OtpStart onSubmit={otp.submitChannel} title="..." description="..." />
 *   : <OtpVerify identifier={otp.identifier} onVerify={(code) => ...} />;
 */
export function useOtpFlow(): OtpFlow {
  const [step, setStep] = useState<OtpFlowStep>("start");
  const [channel, setChannel] = useState<OtpChannelPayload | null>(null);

  return {
    step,
    identifier: channel ? maskOtpChannel(channel) : "",
    submitChannel: (next) => {
      setChannel(next);
      setStep("verify");
    },
    reset: () => {
      setChannel(null);
      setStep("start");
    },
  };
}
