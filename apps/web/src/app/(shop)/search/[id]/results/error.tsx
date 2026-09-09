"use client";

import { Button } from "@ucmp/ui";

export default function ResultsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto flex max-w-8xl flex-col items-center justify-center gap-4 px-5 pt-18 pb-16 text-center md:pt-18 md:pb-20 lg:px-10 lg:pt-32 lg:pb-20">
      <h2 className="h1">Something went wrong</h2>
      <p className="body-lg">
        {process.env.NODE_ENV === "development" && error.message
          ? error.message
          : "Please try again."}
      </p>
      <Button className="mt-2" onClick={reset}>
        Try again
      </Button>
    </section>
  );
}
