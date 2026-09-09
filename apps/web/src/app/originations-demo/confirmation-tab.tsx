"use client";

import { Button } from "@ucmp/ui";
import { useState } from "react";
import { ConfirmationContent } from "~/features/origination";
import {
  CONFIRMATION_MESSAGE_DEFAULT,
  CONFIRMATION_MESSAGE_RED,
} from "~/features/origination/bff/__fixtures__/confirmation.fixture";

export function ConfirmationTab() {
  const [showConfirmation, setShowConfirmation] = useState(true);
  const [variant, setVariant] = useState<"default" | "red">("default");

  const message = variant === "red" ? CONFIRMATION_MESSAGE_RED : CONFIRMATION_MESSAGE_DEFAULT;

  return (
    <div className="flex flex-col gap-6">
      <p className="body-xs font-medium text-text-secondary">
        ⬇ The overlay covers the entire browser viewport (like a modal); click to dismiss
      </p>

      <div className="flex flex-col gap-4">
        {/* Mock flow surface — the overlay renders on top of these elements */}
        <div className="relative min-h-96 overflow-hidden rounded-lg border-2 border-surface-muted border-dashed p-6">
          {!showConfirmation && (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setVariant("default");
                  setShowConfirmation(true);
                }}
                type="button"
                variant="tertiary"
              >
                Show default variant
              </Button>
              <Button
                onClick={() => {
                  setVariant("red");
                  setShowConfirmation(true);
                }}
                type="button"
                variant="tertiary"
              >
                Show red variant
              </Button>
            </div>
          )}

          {showConfirmation && (
            // The consumer owns positioning/sizing — the content fills its
            // parent and centers its own stack. Here a full-screen dismiss
            // Button provides the viewport-sized box; the real flow may size or
            // position it differently.
            <Button
              aria-label="Dismiss confirmation"
              className="fixed inset-0 z-60 h-dvh w-screen rounded-none p-0"
              onClick={() => setShowConfirmation(false)}
              type="button"
              variant="text"
            >
              <ConfirmationContent message={message} variant={variant} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
