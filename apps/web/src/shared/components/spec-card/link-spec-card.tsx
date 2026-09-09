import { CARD_SIZE, type CardLinkProps, type CardSize, LinkCard } from "@shared/components/card";
import type { Surface } from "@ucmp/ui";
import { cn } from "utils";
import { SpecCardContent, type SpecCardContentProps } from "./spec-card-content";

export interface LinkSpecCardProps extends SpecCardContentProps {
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
 * Navigable spec card — wraps SpecCardContent in a LinkCard shell.
 * Server Component safe.
 */
export function LinkSpecCard({
  className,
  linkProps,
  size = "search",
  surface = "dark",
  ...contentProps
}: LinkSpecCardProps) {
  const cardClassName = cn(
    "shrink-0 justify-between gap-0 rounded-2xl bg-white/20 px-6 py-8 text-text-primary shadow-lg ring-0 xl:px-10",
    CARD_SIZE[size],
    className
  );

  return (
    <LinkCard
      className={cardClassName}
      data-surface={surface}
      linkProps={{ "aria-label": contentProps.title, ...linkProps }}
    >
      <SpecCardContent {...contentProps} />
    </LinkCard>
  );
}
