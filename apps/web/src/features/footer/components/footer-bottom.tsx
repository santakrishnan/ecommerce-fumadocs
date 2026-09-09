import { ROUTES } from "@config/routes";
import Link from "next/link";
import { Suspense } from "react";
import { CopyrightYear } from "./copyright-year";

/**
 * FooterBottom - Bottom legal row
 * Server Component — renders copyright and legal navigation links.
 */
export function FooterBottom() {
  return (
    <div className="flex flex-col gap-3 pt-10 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
      <p className="disclaimer text-text-primary">
        &copy;{" "}
        <Suspense>
          <CopyrightYear />
        </Suspense>{" "}
        Toyota Motor Sales, U.S.A., Inc.
        <br className="lg:hidden" /> All information applies to U.S. vehicles only. 9.1.11
      </p>
      <nav aria-label="Legal links">
        <ul className="flex flex-wrap gap-3 lg:gap-5">
          <li>
            <Link className="disclaimer lg:body-sm hover:underline" href={ROUTES.PRIVACY}>
              Privacy Notice
            </Link>
          </li>
          <li>
            <Link className="disclaimer lg:body-sm hover:underline" href="/">
              Legal Terms
            </Link>
          </li>
          <li>
            <Link className="disclaimer lg:body-sm hover:underline" href="/">
              Site Map
            </Link>
          </li>
          <li>
            <Link className="disclaimer lg:body-sm hover:underline" href="/">
              Espanol
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
