import type { CardLinkProps, CardSize as CardSizeToken } from "@shared/components/card";
import { LinkCard } from "@shared/components/card";
import type { Surface } from "@ucmp/ui";
import { cn } from "utils";
import { EditorialCardButton } from "./editorial-card-button";
import {
  EDITORIAL_SIZE_CLASSES,
  EditorialCardContent,
  type EditorialCardContentProps,
} from "./editorial-card-content";

export type { EditorialCardSize } from "./editorial-card-content";

/** Public size names → shared scale tokens for carousel hover scale + skeletons. */
export const EDITORIAL_SIZE_TOKEN: Record<
  EditorialCardContentProps["size"] & string,
  CardSizeToken
> = {
  "large-fill": "search-fill",
  large: "lg",
  medium: "md",
};

export interface LinkEditorialCardProps extends EditorialCardContentProps {
  /** Link destination (required). */
  href: string;
  /** Additional link props (onNavigate, prefetch, etc.). */
  linkProps?: Omit<CardLinkProps, "href" | "aria-label">;
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
 * Navigable editorial card — full-bleed imagery with eyebrow, headline, and
 * optional CTA button adornment. Server Component safe.
 */
export function LinkEditorialCard({
  eyebrow,
  headline,
  href,
  icon,
  imageUrl,
  linkProps,
  matches,
  matchesLabel = "Found Matches",
  size = "medium",
  surface = "dark",
}: LinkEditorialCardProps) {
  const buttonLabel = matches == null ? undefined : `${matches} ${matchesLabel}`;

  return (
    <LinkCard
      adornments={buttonLabel ? <EditorialCardButton label={buttonLabel} /> : undefined}
      className={cn(
        "relative gap-0 overflow-clip border-0 bg-transparent p-0 shadow-none ring-0",
        EDITORIAL_SIZE_CLASSES[size]
      )}
      data-surface={surface}
      linkProps={{
        "aria-label": `${eyebrow}: ${headline}`,
        href,
        ...linkProps,
      }}
      wrapperClassName="group/editorial"
    >
      <EditorialCardContent
        eyebrow={eyebrow}
        headline={headline}
        icon={icon}
        imageUrl={imageUrl}
        size={size}
      />
    </LinkCard>
  );
}
