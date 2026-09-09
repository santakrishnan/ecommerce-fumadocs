import { CARD_SIZE, type CardLinkProps, type CardSize, LinkCard } from "@shared/components/card";
import type { Surface } from "@ucmp/ui";
import { cn } from "utils";
import { ComparisonCardContent, type ComparisonCardContentProps } from "./comparison-card-content";

export interface LinkComparisonCardProps extends ComparisonCardContentProps {
  className?: string;
  /** All valid Next.js Link props — spread onto the link element. */
  linkProps: CardLinkProps;
  /** Shared card size token. @default "search" */
  size?: CardSize;
  /**
   * Surface context — sets `data-surface` on the card root.
   * @default "dark"
   */
  surface?: Surface;
}

/**
 * Navigable comparison card — wraps ComparisonCardContent in a LinkCard shell.
 * Server Component safe.
 */
export function LinkComparisonCard({
  className,
  linkProps,
  size = "search",
  surface = "dark",
  ...contentProps
}: LinkComparisonCardProps) {
  const cardClassName = cn(
    "shrink-0 justify-center gap-8 rounded-2xl border border-white bg-white/20 p-8 text-text-primary shadow-lg ring-0 xl:px-10",
    CARD_SIZE[size],
    className
  );

  return (
    <LinkCard
      className={cardClassName}
      data-surface={surface}
      linkProps={{ "aria-label": contentProps.title, ...linkProps }}
    >
      <ComparisonCardContent {...contentProps} />
    </LinkCard>
  );
}
