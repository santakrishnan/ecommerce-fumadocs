"use client";

import { ButtonCard, type CardButtonProps } from "@shared/components/card";
import type { Surface } from "@ucmp/ui";
import { cn } from "utils";
import { EditorialCardButton } from "./editorial-card-button";
import {
  EDITORIAL_SIZE_CLASSES,
  EditorialCardContent,
  type EditorialCardContentProps,
} from "./editorial-card-content";

export interface ButtonEditorialCardProps extends EditorialCardContentProps {
  /** All valid button props — spread onto the button element. */
  buttonProps: CardButtonProps;
  /**
   * Number of matching results. Shows a CTA button in adornments when present.
   */
  matches?: number;
  /** Label suffix appended to the matches count. @default "Found Matches" */
  matchesLabel?: string;
  /**
   * Surface context — sets `data-surface` on the card root.
   * @default "dark"
   */
  surface?: Surface;
}

/**
 * Clickable editorial card — full-bleed imagery with eyebrow, headline, and
 * optional CTA button adornment. Client Component (accepts non-serializable onClick).
 */
export function ButtonEditorialCard({
  buttonProps,
  eyebrow,
  headline,
  icon,
  imageUrl,
  matches,
  matchesLabel = "Found Matches",
  size = "medium",
  surface = "dark",
}: ButtonEditorialCardProps) {
  const buttonLabel = matches == null ? undefined : `${matches} ${matchesLabel}`;

  return (
    <ButtonCard
      adornments={buttonLabel ? <EditorialCardButton label={buttonLabel} /> : undefined}
      buttonProps={{
        "aria-label": `${eyebrow}: ${headline}`,
        ...buttonProps,
      }}
      className={cn(
        "relative gap-0 overflow-clip border-0 bg-transparent p-0 shadow-none ring-0",
        EDITORIAL_SIZE_CLASSES[size]
      )}
      data-surface={surface}
      wrapperClassName="group/editorial"
    >
      <EditorialCardContent
        eyebrow={eyebrow}
        headline={headline}
        icon={icon}
        imageUrl={imageUrl}
        size={size}
      />
    </ButtonCard>
  );
}
