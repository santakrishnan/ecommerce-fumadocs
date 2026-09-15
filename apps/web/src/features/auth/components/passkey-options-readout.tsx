"use client";

import type { PublicKeyCredentialCreationOptionsJSON } from "../passkey";

/**
 * The parts of the creation options that decide what the "Choose where to
 * save your passkey" sheet shows — exactly as the browser received them.
 */
export function PasskeyOptionsReadout({
  options,
}: {
  options: PublicKeyCredentialCreationOptionsJSON;
}) {
  const shown = {
    "rp.id": options.rp.id,
    "rp.name": options.rp.name,
    authenticatorSelection: options.authenticatorSelection,
    hints: options.hints ?? [],
    excludeCredentials: (options.excludeCredentials ?? []).length,
    attestation: options.attestation,
  };
  return (
    <div
      className="rounded-lg border border-border bg-muted p-3 text-left"
      data-slot="passkey-options-readout"
    >
      <p className="body-sm mb-2 font-medium">Options handed to the browser</p>
      <pre className="overflow-x-auto font-mono text-muted-foreground text-xs">
        {JSON.stringify(shown, null, 2)}
      </pre>
    </div>
  );
}
