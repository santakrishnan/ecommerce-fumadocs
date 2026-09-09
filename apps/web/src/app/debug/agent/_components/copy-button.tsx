"use client";

import { useState } from "react";

const COPIED_RESET_MS = 1500;

/**
 * Dev-tool button that copies a pre-serialized JSON string to the clipboard and
 * flashes a confirmation. Kept dependency-free (no UI Button) to match the rest
 * of the /debug tooling. The value is serialized on the server and passed in as
 * a string so this stays a tiny client island.
 */
export function CopyButton({ value, label = "Copy JSON" }: { label?: string; value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), COPIED_RESET_MS);
      })
      .catch(() => setCopied(false));
  }

  return (
    <button
      className="rounded border border-divider px-2 py-0.5 font-mono text-text-secondary text-xs transition-colors hover:bg-surface-secondary"
      onClick={handleCopy}
      type="button"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
