"use client";

import { GuardedLink, useAuth } from "@features/auth";
import { setSkipAuth } from "@features/demo-settings/actions/set-skip-auth";
import { Button } from "@ucmp/ui";
import { useEffect, useState } from "react";

function describeVisitor(verified: boolean | null) {
  if (verified === null) {
    return "…";
  }
  return verified ? "verified (acr ≥ 1)" : "anonymous (acr 0)";
}

/**
 * The nav bar's Profile link: a `GuardedLink` requiring acr 1 (OTP). When the
 * visitor is anonymous it raises the real auth overlay instead of navigating.
 * The toggle below flips the demo cookie so both states can be tried.
 */
export function GuardedLinkDemo() {
  const { meetsRequirement } = useAuth();
  // Read on the client only — the cookie isn't available during SSR.
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    setVerified(meetsRequirement({ acr: 1 }));
  }, [meetsRequirement]);

  /**
   * Same server action `/demo-settings` uses; the cookie is non-httpOnly so
   * `useAuth().meetsRequirement` sees the new value on the next click.
   */
  const simulate = async (value: "true" | "false") => {
    const result = await setSkipAuth(value);
    if (result.success) {
      setVerified(value === "true");
    }
  };

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-muted-foreground text-xs">
          Visitor is currently{" "}
          <strong className="text-foreground">{describeVisitor(verified)}</strong>
          {" — "}
          {verified ? "the link navigates normally." : "clicking the link opens the OTP overlay."}
        </p>
        <div className="flex gap-2">
          <Button onClick={() => simulate("false")} size="sm" variant="tertiary">
            Simulate anonymous
          </Button>
          <Button onClick={() => simulate("true")} size="sm" variant="tertiary">
            Simulate verified
          </Button>
        </div>
      </div>

      <Button render={<GuardedLink acr={1} href="/profile" />} size="lg" variant="primary">
        Go to profile
      </Button>
    </div>
  );
}
