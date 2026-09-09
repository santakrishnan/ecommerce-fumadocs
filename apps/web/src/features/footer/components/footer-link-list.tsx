import { IconArrowRight } from "@ucmp/ui/icons";
import Link from "next/link";
import type { FooterLink } from "../data/footer-links";

/**
 * FooterLinkList — shared link list used by desktop columns and mobile accordion panels.
 */
export function FooterLinkList({ links }: { links: FooterLink[] }) {
  return (
    <ul className="space-y-5">
      {links.map((link) => (
        <li key={link.label}>
          {link.external ? (
            <a
              className="body-md inline-flex items-center whitespace-nowrap text-text-primary transition-colors hover:text-text-subtle"
              href={link.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              {link.label}
              <IconArrowRight aria-hidden="true" className="ml-1 size-5 shrink-0 -rotate-45" />
            </a>
          ) : (
            <Link
              className="body-md text-text-primary transition-colors hover:text-text-subtle"
              href={link.href}
            >
              {link.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
