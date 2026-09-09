"use client";

import { Card, CardContent } from "@/components";
import { stepToProgress } from "../../lib/step-progress";
import { OriginationPanel } from "../origination-shell/origination-panel";

/**
 * The origination flow's first screen and a worked example of consuming
 * {@link OriginationPanel}. Body is a placeholder until the real form lands;
 * progress is derived via {@link stepToProgress} rather than hardcoded.
 */
export function EntryStepScreen() {
  return (
    <OriginationPanel
      description="2023 Toyota Highlander Hybrid Limited"
      primaryAction={{
        label: "Continue",
      }}
      progress={stepToProgress("entry")}
      tertiaryAction={{
        label: "Continue without saving",
      }}
      title="How would you like to purchase this vehicle?"
    >
      <Card>
        <CardContent>Form content goes here</CardContent>
      </Card>
    </OriginationPanel>
  );
}
