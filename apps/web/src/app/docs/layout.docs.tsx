import "~/docs/docs.css";

import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ReactNode } from "react";
import { baseOptions } from "~/docs/layout.shared";
import { source } from "~/docs/source";

/**
 * Documentation shell. The file is named `layout.docs.tsx` so it is only a
 * route when docs are enabled (see `pageExtensions` in next.config.ts).
 *
 * Fumadocs' RootProvider is nested here rather than in the root layout; its
 * theme provider is disabled because the app already mounts `next-themes`.
 */
export default function DocsRootLayout({ children }: { children: ReactNode }) {
  return (
    <RootProvider search={{ options: { api: "/api/docs-search" } }} theme={{ enabled: false }}>
      <DocsLayout tree={source.getPageTree()} {...baseOptions()}>
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
