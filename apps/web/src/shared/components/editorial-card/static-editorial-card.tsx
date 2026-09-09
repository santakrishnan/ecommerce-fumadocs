import { StaticCard } from "@shared/components/card";
import type { Surface } from "@ucmp/ui";
import { cn } from "utils";
import {
  EDITORIAL_SIZE_CLASSES,
  EditorialCardContent,
  type EditorialCardContentProps,
} from "./editorial-card-content";

export interface StaticEditorialCardProps extends EditorialCardContentProps {
  /**
   * Surface context — sets `data-surface` on the card root.
   * @default "dark"
   */
  surface?: Surface;
}

/**
 * Non-interactive editorial card — full-bleed imagery with eyebrow and headline.
 * Rendered as a plain div (no link, no button). Use for display-only contexts
 * (e.g. skeletons, disabled states, or static promotional content).
 */
export function StaticEditorialCard({
  size = "medium",
  surface = "dark",
  ...contentProps
}: StaticEditorialCardProps) {
  return (
    <StaticCard
      className={cn(
        "relative gap-0 overflow-clip border-0 bg-transparent p-0 shadow-none ring-0",
        EDITORIAL_SIZE_CLASSES[size]
      )}
      data-surface={surface}
    >
      <EditorialCardContent {...contentProps} size={size} />
    </StaticCard>
  );
}
