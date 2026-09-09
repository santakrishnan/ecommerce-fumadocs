"use client";

import { devConsole } from "@shared/lib/dev-console";
import { Button } from "@ucmp/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  devConsole.error("Global error:", error);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4 text-center">
            <h1 className="h1">Application Error</h1>
            <p className="body-lg">A critical error occurred. Please refresh the page.</p>
            {error.digest && <p className="body-sm">Error ID: {error.digest}</p>}
            <Button className="mt-4" onClick={reset}>
              Try again
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
