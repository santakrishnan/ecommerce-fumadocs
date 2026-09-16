"use client";

/** Trace of the nudge sequence, so the behaviour is visible rather than inferred. */
export function PasskeyFlowLog({ log }: { log: string[] }) {
  if (log.length === 0) {
    return null;
  }
  return (
    <ol
      className="rounded-lg border border-border bg-muted p-3 text-left font-mono text-muted-foreground text-xs"
      data-slot="passkey-flow-log"
    >
      {log.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ol>
  );
}
