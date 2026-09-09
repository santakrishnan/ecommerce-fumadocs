"use client";

import { IconCheckmark } from "@ucmp/ui/icons";
import { cn } from "utils";
import type { Surface } from "@/lib/types";

interface ConfirmationContentProps {
  /** Message shown below the checkmark. */
  message: string;
  /** Visual variant. Defaults to `"default"`. */
  variant?: ConfirmationVariant;
}

type ConfirmationVariant = "default" | "red";

/**
 * Per-variant background + surface. The text always uses `text-text-primary`;
 * the surface toggles it between dark-on-light (`light`) and light-on-dark
 * (`dark`), so no per-variant text color is needed.
 */
const VARIANT_CONFIG: Record<ConfirmationVariant, { background: string; surface: Surface }> = {
  default: { background: "bg-surface-secondary", surface: "light" },
  red: { background: "bg-brand", surface: "dark" },
};

export function ConfirmationContent({ message, variant = "default" }: ConfirmationContentProps) {
  const { background, surface } = VARIANT_CONFIG[variant];

  return (
    <div
      className={cn(
        "flex size-full flex-col items-center justify-center gap-4 px-(--page-grid-margin) lg:gap-6",
        background
      )}
      data-step-id="confirmation"
      data-variant={variant}
    >
      {/* White circle (75px) holding the checkmark. It's a light surface, so
          `text-text-primary` resolves the icon to black. */}
      <div
        className="flex size-18 items-center justify-center rounded-full bg-surface-primary"
        data-surface="light"
      >
        {/* IconCheckmark's glyph fills only ~56% of its 20×20 viewBox, so the
            svg is sized up to ~39px to make the visible checkmark ~22px. */}
        <IconCheckmark className="size-10 text-text-primary" />
      </div>

      <p
        className="body-xl w-full max-w-51 text-balance text-text-primary lg:max-w-182.5"
        data-surface={surface}
      >
        {message}
      </p>
    </div>
  );
}
