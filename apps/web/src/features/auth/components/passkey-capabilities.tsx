"use client";

import type { PasskeyCapabilities } from "../passkey";

const ROWS: { key: keyof Omit<PasskeyCapabilities, "raw">; label: string; means: string }[] = [
  {
    key: "immediateGet",
    label: "Immediate mediation",
    means: "can prompt automatically when a passkey exists",
  },
  {
    key: "conditionalGet",
    label: "Conditional UI",
    means: "passkey offered in the email field's autofill",
  },
  {
    key: "passkeyPlatformAuthenticator",
    label: "Platform passkeys",
    means: "Face ID / Touch ID / Windows Hello available",
  },
  {
    key: "hybridTransport",
    label: "Another device (QR)",
    means: "a phone can act as the authenticator",
  },
];

/** What this browser supports, read from `getClientCapabilities()`; decides which nudge layer runs. */
export function PasskeyCapabilitiesCard({
  capabilities,
}: {
  capabilities: PasskeyCapabilities | null;
}) {
  return (
    <div
      className="rounded-lg border border-border bg-muted p-3 text-left"
      data-slot="passkey-capabilities"
    >
      <p className="body-sm mb-2 font-medium">This browser</p>
      {capabilities === null ? (
        <p className="text-muted-foreground text-xs">Reading capabilities…</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {ROWS.map((row) => (
            <li className="flex items-baseline gap-2 text-xs" key={row.key}>
              <span className={capabilities[row.key] ? "text-foreground" : "text-muted-foreground"}>
                {capabilities[row.key] ? "Yes" : "No"}
              </span>
              <span className="font-medium">{row.label}</span>
              <span className="text-muted-foreground">{row.means}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
