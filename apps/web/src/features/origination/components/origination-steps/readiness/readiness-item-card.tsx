import { Card, CardContent } from "@ucmp/ui";
import { IconCheckmark } from "@ucmp/ui/icons";
import { READINESS_CARD_LABEL, type ReadinessItem } from "./readiness-content";

interface ReadinessItemCardProps {
  /** Ordered list of checklist items to render. */
  items: ReadinessItem[];
}

/**
 * ReadinessItemCard — pure informational card listing the documents/details
 * the user should have ready before beginning financing.
 *
 * Non-interactive (rendered as a static `<Card>` div, not `PolyCard`).
 * Server Component — no client JS needed.
 */
function ReadinessItemCard({ items }: ReadinessItemCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        {/* Section eyebrow */}
        <p className="label-sm font-semibold text-text-primary" data-slot="readiness-card-label">
          {READINESS_CARD_LABEL}
        </p>

        {/* Checklist */}
        <ul className="flex flex-col gap-3" data-slot="readiness-item-list">
          {items.map((item) => (
            <li className="flex items-center gap-2" data-slot="readiness-item" key={item.id}>
              <IconCheckmark aria-hidden className="size-4 shrink-0 text-text-primary" />
              <span className="body-sm text-text-primary">{item.label}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export type { ReadinessItemCardProps };
export { ReadinessItemCard };
