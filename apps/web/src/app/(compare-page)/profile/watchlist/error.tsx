"use client";

import { devConsole } from "@shared/lib/dev-console";
import { Button } from "@ucmp/ui";

export default function ProfileWatchlistError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  devConsole.error("Profile watchlist error:", error);

  return (
    <div
      aria-live="assertive"
      className="flex min-h-[60vh] flex-col items-center justify-center p-4"
      role="alert"
    >
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="h1">Something went wrong</h1>
        <p className="body-lg">We couldn&apos;t load this page. Please try again.</p>
        {error.digest && <p className="body-sm">Error ID: {error.digest}</p>}
        <Button onClick={reset} size="lg">
          Try again
        </Button>
      </div>
    </div>
  );
}
