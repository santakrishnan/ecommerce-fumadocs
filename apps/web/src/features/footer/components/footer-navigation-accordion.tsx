"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@ucmp/ui";
import type { FooterSection } from "../data/footer-links";
import { FooterLinkList } from "./footer-link-list";

/**
 * FooterNavigationAccordion — mobile/tablet accordion for footer nav.
 * Client Component — only the interactive accordion needs JS.
 */
export function FooterNavigationAccordion({ sections }: { sections: FooterSection[] }) {
  return (
    <Accordion>
      {sections.map((section, index) => (
        <AccordionItem key={section.title} value={`section-${index}`}>
          <AccordionTrigger>{section.title}</AccordionTrigger>
          <AccordionContent>
            <FooterLinkList links={section.links} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
