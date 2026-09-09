import { CardBackgroundImage } from "@shared/components/card";
import { CardContent, CardHeader, CardTitle, Eyebrow } from "@ucmp/ui";
import type { IconProps } from "@ucmp/ui/icons";
import { cn } from "utils";

export type EditorialCardSize = "large" | "large-fill" | "medium";

/**
 * Editorial dimensions are aspect-ratio based and intentionally CARD-LOCAL —
 * the responsive profile (peek tuning per breakpoint, and the lg 448×601 height)
 * differs from the shared fixed-height `CARD_SIZE` tokens. Converging onto
 * `CARD_SIZE.md/lg` (which would also reconcile 601 → 597) is a staged design
 * decision (ADR-0003 Phase 2); until approved, these classes are pinned by
 * `editorial-card.test`.
 */
export const EDITORIAL_SIZE_CLASSES: Record<EditorialCardSize, string> = {
  large: "aspect-[360/480] lg:aspect-[448/601]",
  "large-fill":
    "w-[360px] aspect-[360/480] md:w-[360px] md:aspect-[360/480] lg:h-[calc(100dvh_-_var(--search-nav-height,7.5rem)_-_8.5rem)] lg:w-auto lg:aspect-[448/601]",
  medium: "aspect-[268/357] lg:aspect-[334/445]",
};

/**
 * Responsive sizes hint so the browser picks the right srcset candidate.
 * Values approximate grid-column widths rather than fixed card pixels.
 */
const IMAGE_SIZES: Record<EditorialCardSize, string> = {
  large: "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 85vw",
  "large-fill": "(min-width: 1024px) 451px, 360px",
  medium: "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 66vw",
};

export interface EditorialCardContentProps {
  /** Small label above the headline (e.g. "5 new matches") */
  eyebrow: string;
  /** Main headline text */
  headline: string;
  /** Icon component from @ucmp/ui/icons displayed before the eyebrow text */
  icon?: React.ComponentType<IconProps>;
  /** Image URL for the full-bleed background. */
  imageUrl: string;
  /** Card size — controls dimensions per breakpoint. @default "medium" */
  size?: EditorialCardSize;
}

/**
 * Visual content for an editorial card — full-bleed background image with
 * eyebrow and headline text overlay. No shell, no interactivity.
 * Compose inside LinkCard/ButtonCard.
 */
export function EditorialCardContent({
  eyebrow,
  headline,
  icon: Icon,
  imageUrl,
  size = "medium",
}: EditorialCardContentProps) {
  return (
    <>
      <CardBackgroundImage alt="" priority sizes={IMAGE_SIZES[size]} src={imageUrl} />
      <CardContent className={cn("absolute inset-0 flex flex-col justify-start p-0 px-8 py-10")}>
        <CardHeader className="gap-1 p-0">
          <Eyebrow>
            {Icon && <Icon />}
            {eyebrow}
          </Eyebrow>
          <CardTitle className="h3 mt-1.5 text-text-primary">
            <h3 className="line-clamp-3">{headline}</h3>
          </CardTitle>
        </CardHeader>
      </CardContent>
    </>
  );
}
