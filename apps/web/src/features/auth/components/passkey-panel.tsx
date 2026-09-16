"use client";

import { Button, Field, FieldError, FloatingInput, FloatingLabel } from "@ucmp/ui";
import { KeyRoundIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "utils";
import { usePasskeyNudge } from "../hooks/use-passkey-nudge";
import {
  DEFAULT_REGISTRATION_POLICY,
  describePasskeyError,
  getPasskeySession,
  type PasskeyCredentialSummary,
  type PasskeyRegistrationPolicy,
  type PasskeyUser,
  type PublicKeyCredentialCreationOptionsJSON,
  passkeysSupported,
  registerPasskey,
  resetPasskeyDemo,
  signInWithPasskey,
} from "../passkey";
import { PasskeyCapabilitiesCard } from "./passkey-capabilities";
import { PasskeyFlowLog } from "./passkey-flow-log";
import { PasskeyList } from "./passkey-list";
import { PasskeyOptionsReadout } from "./passkey-options-readout";
import { PasskeyPolicyControls } from "./passkey-policy-controls";
import { StoredPasskeyCard } from "./stored-passkey-card";

type Status = "loading" | "unsupported" | "anonymous" | "signed-in";

interface CeremonyResult {
  credential: PasskeyCredentialSummary;
  rpID: string;
  user: PasskeyUser;
}

interface Outcome extends CeremonyResult {
  title: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PasskeyPanelProps {
  className?: string;
  /** Run the sign-in nudge layers (immediate mediation, conditional UI, RP hint) and show the trace. */
  showNudge?: boolean;
  /** Show the registration-policy controls and the options readout (demo-only). */
  showPolicy?: boolean;
  /** Show the "Reset demo" link — MOCK-ONLY, remove with the mock server. */
  showReset?: boolean;
}

/**
 * Demo panel for the passkey flow: create a passkey, come back and sign in
 * with it, manage the passkeys the RP holds, and see which nudge layer fired.
 * Client-side ceremonies only; the RP is behind `features/auth/passkey`
 * (mock today, upstream BED later).
 */
export function PasskeyPanel({
  className,
  showNudge = true,
  showPolicy = false,
  showReset = true,
}: PasskeyPanelProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<PasskeyUser | null>(null);
  const [rpID, setRpID] = useState<string>("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [listVersion, setListVersion] = useState(0);
  const [policy, setPolicy] = useState<Required<PasskeyRegistrationPolicy>>(
    DEFAULT_REGISTRATION_POLICY
  );
  const [lastOptions, setLastOptions] = useState<PublicKeyCredentialCreationOptionsJSON | null>(
    null
  );

  useEffect(() => {
    if (!passkeysSupported()) {
      setStatus("unsupported");
      return;
    }
    getPasskeySession().then((session) => {
      setUser(session.user);
      setRpID(session.rpID);
      setStatus(session.user ? "signed-in" : "anonymous");
    });
  }, []);

  const complete = (title: string, result: CeremonyResult) => {
    setUser(result.user);
    setRpID(result.rpID);
    setOutcome({ ...result, title });
    setStatus("signed-in");
    setListVersion((v) => v + 1);
  };

  const nudge = usePasskeyNudge(showNudge && status === "anonymous", (result) =>
    complete("Signed in with passkey", result)
  );

  const run = async (title: string, action: () => Promise<CeremonyResult>) => {
    setBusy(true);
    setError(null);
    try {
      complete(title, await action());
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
        <>
          {nudge.hinted && (
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="body-sm text-muted-foreground">You have a passkey on this device.</p>
              <Button
                disabled={busy}
                leadingIcon={KeyRoundIcon}
                onClick={signIn}
                size="lg"
                variant="primary"
              >
                Sign in with your passkey
              </Button>
            </div>
          )}
          <CreatePasskeyForm
            busy={busy}
            onCreate={(input) =>
              run("Passkey created", () =>
                registerPasskey(
                  { ...input, ...(showPolicy ? { policy } : {}) },
                  { onOptions: setLastOptions }
                )
              )
            }
            onSignIn={signIn}
            signInSecondary={nudge.hinted}
          />
          {showPolicy && <PasskeyPolicyControls onChange={setPolicy} policy={policy} />}
          {showPolicy && lastOptions && <PasskeyOptionsReadout options={lastOptions} />}
          {showNudge && <PasskeyCapabilitiesCard capabilities={nudge.capabilities} />}
          {showNudge && <PasskeyFlowLog log={nudge.log} />}
        </>
      )}

      {status === "signed-in" && user && (
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 className="h2">Welcome back, {user.name.split(" ")[0]}</h2>
          <p className="body-md text-muted-foreground">
            No username or password, just your passkey.
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

      {status === "signed-in" && user && (
        <PasskeyList rpID={rpID} userID={user.id} version={listVersion} />
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
  signInSecondary,
}: {
  busy: boolean;
  onCreate: (input: { name: string; email: string }) => void;
  onSignIn: () => void;
  signInSecondary: boolean;
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
        {/* `webauthn` token: conditional UI offers passkeys in this field's autofill. */}
        <FloatingInput
          autoComplete="username webauthn"
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
      {!signInSecondary && (
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
      )}
    </form>
  );
}
