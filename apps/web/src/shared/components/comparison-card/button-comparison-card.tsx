"use client";

import {
  ButtonCard,
  CARD_SIZE,
  type CardButtonProps,
  type CardSize,
} from "@shared/components/card";
import type { Surface } from "@ucmp/ui";
import { cn } from "utils";
import { ComparisonCardContent, type ComparisonCardContentProps } from "./comparison-card-content";

export interface ButtonComparisonCardProps extends ComparisonCardContentProps {
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
 * Clickable comparison card — wraps ComparisonCardContent in a ButtonCard shell.
 * Client Component (accepts non-serializable onClick).
 */
export function ButtonComparisonCard({
  buttonProps,
  className,
  size = "search",
  surface = "dark",
  ...contentProps
}: ButtonComparisonCardProps) {
  const cardClassName = cn(
    "shrink-0 justify-center gap-8 rounded-2xl border border-white bg-white/20 p-8 text-text-primary shadow-lg ring-0 xl:px-10",
    CARD_SIZE[size],
    className
  );

  return (
    <ButtonCard
      buttonProps={{ "aria-label": contentProps.title, ...buttonProps }}
      className={cardClassName}
      data-surface={surface}
    >
      <ComparisonCardContent {...contentProps} />
    </ButtonCard>
  );
}
