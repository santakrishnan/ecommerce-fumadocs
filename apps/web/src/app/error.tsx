"use client";

import { devConsole } from "@shared/lib/dev-console";
import { Button } from "@ucmp/ui";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log to console in development only (production error reporting is out of scope)
  devConsole.error("Application error:", error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="h1">Something went wrong!</h1>
        <p className="body-lg">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        {error.digest && <p className="body-sm">Error ID: {error.digest}</p>}
        <Button onClick={reset} size="lg">
          Try again
        </Button>
      </div>
    </div>
  );
}
