"use client";

import { Button, Field, FieldError, FloatingInput, FloatingLabel } from "@ucmp/ui";
import { KeyRoundIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "utils";
import {
  describePasskeyError,
  getPasskeySession,
  type PasskeyCredentialSummary,
  type PasskeyUser,
  passkeysSupported,
  registerPasskey,
  resetPasskeyDemo,
  signInWithPasskey,
} from "../passkey";
import { StoredPasskeyCard } from "./stored-passkey-card";

type Status = "loading" | "unsupported" | "anonymous" | "signed-in";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CeremonyResult {
  credential: PasskeyCredentialSummary;
  user: PasskeyUser;
}

interface Outcome extends CeremonyResult {
  title: string;
}

export interface PasskeyPanelProps {
  className?: string;
  /** Show the "Reset demo" link — MOCK-ONLY, remove with the mock server. */
  showReset?: boolean;
}

/**
 * Demo panel for the passkey flow: create a passkey for a new user, come back
 * later and sign in with it, and inspect what the relying party stored.
 * Presentational + client-side ceremonies only; the RP is behind
 * `features/auth/passkey` (mock today, upstream BED later).
 */
export function PasskeyPanel({ className, showReset = true }: PasskeyPanelProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<PasskeyUser | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!passkeysSupported()) {
      setStatus("unsupported");
      return;
    }
    getPasskeySession().then((session) => {
      setUser(session);
      setStatus(session ? "signed-in" : "anonymous");
    });
  }, []);

  const run = async (title: string, action: () => Promise<CeremonyResult>) => {
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      setUser(result.user);
      setOutcome({ ...result, title });
      setStatus("signed-in");
    } catch (err) {
      setError(describePasskeyError(err));
    } finally {
      setBusy(false);
    }
  };

  const signIn = () => run("Signed in with passkey", () => signInWithPasskey());

  const reset = async () => {
    setBusy(true);
    setError(null);
    try {
      await resetPasskeyDemo();
      setUser(null);
      setOutcome(null);
      setStatus("anonymous");
    } catch (err) {
      setError(describePasskeyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("flex w-full max-w-md flex-col gap-6", className)} data-slot="passkey-panel">
      {status === "loading" && (
        <p className="body-md text-muted-foreground">Checking passkey support…</p>
      )}

      {status === "unsupported" && (
        <p className="body-md text-destructive">
          This browser does not support WebAuthn / passkeys.
        </p>
      )}

      {status === "anonymous" && (
        <CreatePasskeyForm
          busy={busy}
          onCreate={(input) => run("Passkey created", () => registerPasskey(input))}
          onSignIn={signIn}
        />
      )}

      {status === "signed-in" && user && (
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 className="h2">Welcome back, {user.name.split(" ")[0]}</h2>
          <p className="body-md text-muted-foreground">
            No username or password — just your passkey.
          </p>
          <Button
            disabled={busy}
            leadingIcon={KeyRoundIcon}
            onClick={signIn}
            size="lg"
            variant="primary"
          >
            Sign in with passkey
          </Button>
        </div>
      )}

      {error && (
        <p className="body-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {outcome && user && (
        <StoredPasskeyCard credential={outcome.credential} title={outcome.title} user={user} />
      )}

      {showReset && status !== "loading" && status !== "unsupported" && (
        <button
          className="link-text self-center text-muted-foreground text-xs underline underline-offset-4"
          disabled={busy}
          onClick={reset}
          type="button"
        >
          Reset demo
        </button>
      )}
    </div>
  );
}

function CreatePasskeyForm({
  busy,
  onCreate,
  onSignIn,
}: {
  busy: boolean;
  onCreate: (input: { name: string; email: string }) => void;
  onSignIn: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const emailValid = EMAIL_PATTERN.test(email.trim());
  const valid = name.trim().length > 0 && emailValid;

  return (
    <form
      className="flex flex-col gap-6"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setTouched(true);
        if (valid) {
          onCreate({ name: name.trim(), email: email.trim() });
        }
      }}
    >
      <div className="flex flex-col gap-2 text-center">
        <h2 className="h2">Create a passkey</h2>
        <p className="body-md text-muted-foreground">
          Sign in next time with Face ID, Touch ID or your device PIN.
        </p>
      </div>

      <Field className="relative" data-invalid={touched && name.trim().length === 0}>
        <FloatingInput
          autoComplete="name"
          id="passkey-name"
          name="name"
          onChange={(e) => setName(e.target.value)}
          value={name}
        />
        <FloatingLabel htmlFor="passkey-name">Name</FloatingLabel>
        {touched && name.trim().length === 0 && <FieldError>Enter your name.</FieldError>}
      </Field>

      <Field className="relative" data-invalid={touched && !emailValid}>
        <FloatingInput
          autoComplete="email webauthn"
          id="passkey-email"
          inputMode="email"
          name="email"
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          value={email}
        />
        <FloatingLabel htmlFor="passkey-email">Email</FloatingLabel>
        {touched && !emailValid && <FieldError>Enter a valid email.</FieldError>}
      </Field>

      <Button
        disabled={busy}
        fullWidth
        leadingIcon={KeyRoundIcon}
        size="lg"
        type="submit"
        variant="primary"
      >
        Create a passkey
      </Button>
      <Button
        disabled={busy}
        fullWidth
        onClick={onSignIn}
        size="lg"
        type="button"
        variant="tertiary"
      >
        Sign in with an existing passkey
      </Button>
    </form>
  );
}
