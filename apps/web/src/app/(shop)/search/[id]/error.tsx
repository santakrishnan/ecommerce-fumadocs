"use client";

import { Button } from "@ucmp/ui";

export default function SearchResultsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="py-16">
      <h2 className="h1">Search failed</h2>
      <p className="body-lg mt-2">{error.message || "Please try again."}</p>
      <Button className="mt-4" onClick={reset}>
        Try again
      </Button>
    </section>
  );
}
