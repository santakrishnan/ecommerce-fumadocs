import type { ReactNode } from "react";

/**
 * Props for the SectionHeader component.
 */
export interface SectionHeaderProps {
  /** Optional children rendered below the header (slot for additional content) */
  children?: ReactNode;
  /** Optional icon displayed to the left of the title at 16px (size-4) */
  icon?: ReactNode;
  /** Optional id for the heading element (enables aria-labelledby on parent section) */
  id?: string;
  /** Descriptive subtitle rendered below the title */
  subtitle: string;
  /** Bold uppercase title rendered as an <h2> */
  title: string;
}

/**
 * Reusable section header composite that displays an optional icon, a bold
 * uppercase title, a descriptive subtitle, and an optional children slot.
 * Used across all landing page sections for consistent labeling and semantic structure.
 *
 * @example
 * ```tsx
 * import { Car } from "lucide-react";
 * import { SectionHeader } from "@shared/components/section-header";
 *
 * <SectionHeader
 *   id="dealer-offers-heading"
 *   title="Browse by Style"
 *   subtitle="These cars are priced to sell"
 *   icon={<Car />}
 * />
 * ```
 */
export function SectionHeader({ title, subtitle, icon, id, children }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="carousel-headline text-text-primary" id={id}>
        {icon ? (
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="inline-flex size-4 shrink-0 [&>svg]:size-4">
              {icon}
            </span>
            {title}
          </span>
        ) : (
          title
        )}
      </h2>
      <p className="body-md text-text-subtle">{subtitle}</p>
      {children}
    </div>
  );
}
