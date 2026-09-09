"use client";

import {
  ButtonCard,
  CARD_SIZE,
  type CardButtonProps,
  type CardSize,
} from "@shared/components/card";
import type { Surface } from "@ucmp/ui";
import { cn } from "utils";
import { SpecCardContent, type SpecCardContentProps } from "./spec-card-content";

export interface ButtonSpecCardProps extends SpecCardContentProps {
  /** All valid button props — spread onto the button element. */
  buttonProps: CardButtonProps;
  className?: string;
  /** Shared card size token. @default "search" */
  size?: CardSize;
  /**
   * Surface context — sets `data-surface` on the card root.
   * @default "dark"
   */
  surface?: Surface;
}

/**
 * Clickable generic spec card — wraps SpecCardContent in a ButtonCard shell.
 * Client Component (accepts onClick).
 */
export function ButtonSpecCard({
  buttonProps,
  className,
  size = "search",
  surface = "dark",
  ...contentProps
}: ButtonSpecCardProps) {
  const cardClassName = cn(
    "shrink-0 justify-between gap-0 rounded-2xl bg-white/20 px-6 py-8 text-text-primary shadow-lg ring-0 xl:px-10",
    CARD_SIZE[size],
    className
  );

  return (
    <ButtonCard
      buttonProps={{ "aria-label": contentProps.title, ...buttonProps }}
      className={cardClassName}
      data-surface={surface}
    >
      <SpecCardContent {...contentProps} />
    </ButtonCard>
  );
}
