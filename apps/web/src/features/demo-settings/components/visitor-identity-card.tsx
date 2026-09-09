"use client";

import { useVisitorIdentity } from "@shared/providers/visitor-provider";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Textarea,
} from "@ucmp/ui";
import { useEffect, useRef, useState, useTransition } from "react";
import { z } from "zod/v4";
import { generateVisitorIdentity } from "../actions/reset-visitor-identity";
import { setVisitorIdentity } from "../actions/set-visitor-identity";
import { visitorIdentitySchema } from "../lib/visitor-identity-schema";

interface CookieSnapshot {
  fpId: string | null;
  geo: string | null;
  sessionId: string | null;
  visitorId: string | null;
  zip: string | null;
}

interface VisitorIdentityCardProps {
  cookieSnapshot?: CookieSnapshot;
}

function snapshotToText(snapshot: CookieSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

const EMPTY_SNAPSHOT: CookieSnapshot = {
  fpId: null,
  geo: null,
  sessionId: null,
  visitorId: null,
  zip: null,
};

/**
 * Demo card for generating or manually setting visitor identity cookies.
 * The textarea is editable — "Set Visitor Identity" submits the JSON,
 * Zod-validates it, and writes the cookies via a Server Action.
 *
 * After a generate + reload, visitorId/sessionId start null (cookies were
 * cleared). useVisitorIdentity patches them in once the resolve flow completes.
 */
export function VisitorIdentityCard({ cookieSnapshot }: VisitorIdentityCardProps) {
  const [isPending, startTransition] = useTransition();
  const [lastId, setLastId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [_snapshot, setSnapshot] = useState<CookieSnapshot>(cookieSnapshot ?? EMPTY_SNAPSHOT);
  const baselineRef = useRef(snapshotToText(cookieSnapshot ?? EMPTY_SNAPSHOT));
  const [text, setText] = useState(baselineRef.current);

  // Once the resolve flow completes, VisitorProvider surfaces the new
  // visitorId / sessionId. Patch the snapshot and reset the baseline so
  // the textarea updates and the "Set" button stays disabled (not dirty).
  const { visitorId, sessionId } = useVisitorIdentity();
  useEffect(() => {
    if (!(visitorId || sessionId)) {
      return;
    }
    setSnapshot((prev) => {
      const next: CookieSnapshot = {
        ...prev,
        visitorId: visitorId ?? prev.visitorId,
        sessionId: sessionId ?? prev.sessionId,
      };
      const nextText = snapshotToText(next);
      baselineRef.current = nextText;
      setText(nextText);
      return next;
    });
  }, [visitorId, sessionId]);

  const isDirty = text !== baselineRef.current;

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateVisitorIdentity();
      if (result.success) {
        setLastId(result.syntheticId);
        window.location.reload();
      }
    });
  }

  function handleSet() {
    setError(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("Invalid JSON");
      return;
    }

    const validated = visitorIdentitySchema.safeParse(parsed);
    if (!validated.success) {
      setError(z.prettifyError(validated.error));
      return;
    }

    startTransition(async () => {
      const result = await setVisitorIdentity(validated.data);
      if (result.success) {
        window.location.reload();
      } else {
        setError(result.error ?? "Failed to set identity");
      }
    });
  }

  return (
    <Card id="section-visitor-identity">
      <CardHeader className="pt-5">
        <CardTitle>Visitor identity</CardTitle>
        <CardDescription>
          <p>
            Generate a new visitor identity to simulate a first-time visitor. Creates a synthetic
            fingerprint ID → new hash → new VPS profile with empty preferences and watchlist. The
            search agent backend, profile tier, and appointment variant settings are preserved.
          </p>
          <p className="mt-2">
            Clears: fingerprint ID, visitor ID, session ID, profile ID, visit timestamps. Triggers
            full page reload.
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Button disabled={isPending} onClick={handleGenerate} type="button">
            {isPending ? "Generating…" : "Generate visitor identity"}
          </Button>
          {lastId && (
            <span className="font-mono text-text-secondary text-xs">
              Last: {lastId.slice(0, 8)}…
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Textarea
            aria-label="Visitor identity JSON"
            className="whitespace-pre rounded-lg bg-surface-secondary font-mono text-text-primary text-xs"
            disabled={isPending}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            value={text}
          />
          {error && <p className="text-destructive text-xs">{error}</p>}
          <Button
            className="self-start"
            disabled={!isDirty || isPending}
            onClick={handleSet}
            type="button"
            variant="secondary"
          >
            {isPending ? "Setting…" : "Set visitor identity"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
