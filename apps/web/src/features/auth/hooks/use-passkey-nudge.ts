"use client";

import { useEffect, useRef, useState } from "react";
import {
  armPasskeyAutofill,
  cancelPasskeyAutofill,
  getPasskeyCapabilities,
  type PasskeyCapabilities,
  type PasskeyLoginResult,
  readPasskeyHint,
  signInWithPasskeyImmediate,
} from "../passkey";

export interface PasskeyNudgeState {
  capabilities: PasskeyCapabilities | null;
  /** True when the RP hint cookie says a platform passkey was used from this browser. */
  hinted: boolean;
  /** Human-readable trace of which layer did what (shown in the demo). */
  log: string[];
  /** False until the document was focused or interacted with, which is when the prompts start. */
  started: boolean;
}

interface Ctx {
  isActive: () => boolean;
  note: (line: string) => void;
  signedIn: (result: PasskeyLoginResult) => void;
}

/**
 * The browser allows one pending WebAuthn request per tab. A preview that arms
 * conditional UI the moment it loads would block every other passkey button on
 * the page (they fail with "A request is already pending"). So the nudge waits
 * until this document is focused or the user interacts with it.
 */
function whenInteracted(isActive: () => boolean): Promise<void> {
  if (document.hasFocus()) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const events = ["pointerdown", "focusin", "keydown"] as const;
    const done = () => {
      for (const name of events) {
        document.removeEventListener(name, done, true);
      }
      window.removeEventListener("focus", done);
      if (isActive()) {
        resolve();
      }
    };
    for (const name of events) {
      document.addEventListener(name, done, { capture: true, once: true });
    }
    window.addEventListener("focus", done, { once: true });
  });
}

/** Layer 1: immediate mediation. Returns true when it completed a sign-in. */
async function tryImmediate(caps: PasskeyCapabilities, ctx: Ctx): Promise<boolean> {
  if (!caps.immediateGet) {
    ctx.note("immediate: not supported in this browser");
    return false;
  }
  ctx.note("immediate: supported, asking the browser…");
  const outcome = await signInWithPasskeyImmediate();
  if (!ctx.isActive()) {
    return true;
  }
  if (outcome.kind === "signed-in") {
    ctx.note("immediate: signed in");
    ctx.signedIn(outcome.result);
    return true;
  }
  const reason = outcome.kind === "no-passkey" ? "no passkey here (or dismissed)" : outcome.kind;
  ctx.note(`immediate: ${reason}`);
  return false;
}

/** Layer 2: conditional UI on the email field. Resolves when the user picks a passkey. */
async function tryConditional(caps: PasskeyCapabilities, ctx: Ctx): Promise<void> {
  if (!caps.conditionalGet) {
    ctx.note("conditional UI: not supported in this browser");
    return;
  }
  ctx.note("conditional UI: armed on the email field");
  try {
    const result = await armPasskeyAutofill();
    if (ctx.isActive()) {
      ctx.note("conditional UI: signed in");
      ctx.signedIn(result);
    }
  } catch {
    if (ctx.isActive()) {
      ctx.note("conditional UI: cancelled");
    }
  }
}

/**
 * Runs the sign-in nudge sequence from the approach document while the user
 * is anonymous: read the RP hint and capabilities → wait for focus → try
 * immediate mediation → arm conditional UI on the email field. Calls
 * `onSignedIn` when any layer completes a sign-in; the caller renders the
 * OTP/email form regardless.
 */
export function usePasskeyNudge(
  enabled: boolean,
  onSignedIn: (result: PasskeyLoginResult) => void
): PasskeyNudgeState {
  const [capabilities, setCapabilities] = useState<PasskeyCapabilities | null>(null);
  const [hinted, setHinted] = useState(false);
  const [started, setStarted] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const onSignedInRef = useRef(onSignedIn);
  onSignedInRef.current = onSignedIn;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const liveness = { active: true };
    const isActive = () => liveness.active;
    const ctx: Ctx = {
      isActive,
      // Numbered so each line is a stable, unique React key.
      note: (line) => isActive() && setLog((prev) => [...prev, `${prev.length + 1}. ${line}`]),
      signedIn: (result) => onSignedInRef.current(result),
    };

    const run = async () => {
      const hint = readPasskeyHint();
      setHinted(hint);
      ctx.note(hint ? "hint: this browser used a platform passkey before" : "hint: none");

      const caps = await getPasskeyCapabilities();
      if (!isActive()) {
        return;
      }
      setCapabilities(caps);

      if (!document.hasFocus()) {
        ctx.note("waiting: click or tap this preview to start the passkey prompt");
      }
      await whenInteracted(isActive);
      if (!isActive()) {
        return;
      }
      setStarted(true);

      if (await tryImmediate(caps, ctx)) {
        return;
      }
      await tryConditional(caps, ctx);
    };

    run();
    return () => {
      liveness.active = false;
      cancelPasskeyAutofill();
    };
  }, [enabled]);

  return { capabilities, hinted, log, started };
}
