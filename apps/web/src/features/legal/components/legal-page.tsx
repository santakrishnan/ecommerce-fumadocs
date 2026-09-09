/**
 * Legal Page Component
 * Renders long-form legal content pages with structured data
 * Combines page shell and content renderer
 */

import { IconToyotaX } from "@ucmp/ui/icons";
import type { LegalSection } from "../data/privacy-notice";

export interface LegalPageProps {
  /** Last updated date string */
  lastUpdated: string;
  /** Section heading (displayed left-aligned below title) */
  sectionHeading: string;
  /** Content sections with paragraphs and lists */
  sections: LegalSection[];
  /** Page title (displayed centered at top) */
  title: string;
  /** Label for the updated date (e.g., "UPDATED AS OF:") */
  updatedLabel?: string;
}

/**
 * Renders structured legal content with support for:
 * - Headings
 * - Paragraphs with optional bold text spans
 * - Bulleted lists with optional nesting
 */
function LegalContentRenderer({ sections }: { sections: LegalSection[] }) {
  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: data is immutable and static
        <section className="space-y-2" key={index}>
          {section.heading && <h3 className="h3">{section.heading}</h3>}

          {section.paragraphs.map((paragraph, pIndex) => {
            // Handle array of text segments (for rich text with bold)
            if (Array.isArray(paragraph)) {
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: data is immutable and static
                <p className="body-md" key={pIndex}>
                  {paragraph.map((segment, segIndex) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: data is immutable and static
                    <span className={segment.bold ? "font-bold" : ""} key={segIndex}>
                      {segment.text}
                    </span>
                  ))}
                </p>
              );
            }
            // Handle plain string paragraphs
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: data is immutable and static
              <p className="body-md" key={pIndex}>
                {paragraph}
              </p>
            );
          })}

          {section.list && (
            <ul className="space-y-1 pl-6">
              {section.list.items.map((item, itemIndex) => {
                // Handle string items
                if (typeof item === "string") {
                  return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: data is immutable and static
                    <li className="body-md list-disc" key={itemIndex}>
                      {item}
                    </li>
                  );
                }
                // Handle items with subitems
                return (
                  // biome-ignore lint/suspicious/noArrayIndexKey: data is immutable and static
                  <li className="body-md list-disc" key={itemIndex}>
                    {item.text}
                    {item.subitems && item.subitems.length > 0 && (
                      <ul className="mt-1 space-y-1 pl-6">
                        {item.subitems.map((subitem, subIndex) => (
                          <li
                            className="body-md list-disc"
                            // biome-ignore lint/suspicious/noArrayIndexKey: data is immutable and static
                            key={subIndex}
                          >
                            {subitem}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

/**
 * Legal page component for long-form legal content pages.
 * Handles title, section heading, update date, and responsive layout.
 *
 * @example
 * ```tsx
 * <LegalPage
 *   title="Your Privacy Rights"
 *   sectionHeading="Toyota Privacy Notice"
 *   lastUpdated="April 7, 2026"
 *   sections={PRIVACY_NOTICE.sections}
 * />
 * ```
 */
export function LegalPage({
  lastUpdated,
  sectionHeading,
  sections,
  title,
  updatedLabel = "UPDATED AS OF:",
}: LegalPageProps) {
  return (
    <article className="col-span-full lg:col-span-8 lg:col-start-3">
      <div className="space-y-12 px-6 py-12 md:px-5 lg:px-0 lg:py-16">
        {/* Brand icon */}
        <div className="mb-2 flex justify-center">
          <IconToyotaX className="size-16 text-brand" />
        </div>

        {/* Page title */}
        <div className="mb-14 text-center lg:mb-20">
          <h1 className="h1">{title}</h1>
        </div>

        <div className="space-y-6">
          {/* Section heading */}
          <h2 className="h3 mb-8">{sectionHeading}</h2>

          {/* Last updated date */}
          <p className="body-md mb-4">
            <span>
              {updatedLabel} {lastUpdated}
            </span>
          </p>

          {/* Main content */}
          <LegalContentRenderer sections={sections} />
        </div>
      </div>
    </article>
  );
}
