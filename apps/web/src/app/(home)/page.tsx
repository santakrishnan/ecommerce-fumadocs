import { HomeShell } from "@features/landing";
import type { Metadata } from "next";

export const instant = false;

export const metadata: Metadata = {
  title: "Search for a car your way",
  description:
    "Start with a model, budget, features, or even just what you'll use it for and I'll find the best matches for you.",
};

/** DEV-only `?exp=` override to force a home mode without waiting 2h. */
type HomeSearchParams = Promise<{ exp?: string | string[] }>;

/**
 * Home (`/`) — synchronous PPR shell.
 *
 * Renders the static hero immediately and defers the personalized body into a
 * Suspense hole (`HomeShell`). The lapsed-return → `/welcome-back` redirect is
 * handled at the edge in `proxy.ts`, so this page never blocks on `/resolve`.
 */
export default function HomePage({ searchParams }: { searchParams: HomeSearchParams }) {
  return <HomeShell searchParams={searchParams} />;
}
