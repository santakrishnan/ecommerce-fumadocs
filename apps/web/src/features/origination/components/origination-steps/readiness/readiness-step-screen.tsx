"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { OriginationPanel } from "../../origination-shell/origination-panel";
import {
  READINESS_CONTINUE_LABEL,
  READINESS_DESCRIPTION,
  READINESS_TITLE,
} from "./readiness-content";

// ─── Routes ──────────────────────────────────────────────────────────────────

/** The route the Continue button advances to. */
const NEXT_STEP_HREF = "/originations";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReadinessStepScreenProps {
  /**
   * Card content passed from the server page. Accepting children here keeps
   * `ReadinessItemCard` and its static content out of the client module graph —
   * server JSX passed as children is rendered on the server even though this
   * component is a client boundary.
   */
  children: ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Client shell for the pre-financing readiness screen.
 *
 * Owns only the interactive behaviour: `router.back()` for close and the
 * Link-rendered Continue button. All static content (card, copy) is passed
 * as children from the server page so it never enters the client bundle.
 *
 * Progress bar is hidden (pre-flow step has no position in the step order).
 */
export function ReadinessStepScreen({ children }: ReadinessStepScreenProps) {
  const router = useRouter();

  return (
    <OriginationPanel
      description={READINESS_DESCRIPTION}
      onClose={() => router.back()}
      primaryAction={{
        buttonProps: {
          nativeButton: false,
          render: <Link href={NEXT_STEP_HREF} />,
        },
        label: READINESS_CONTINUE_LABEL,
      }}
      showProgress={false}
      title={READINESS_TITLE}
    >
      {children}
    </OriginationPanel>
  );
}
