import { notFound } from "next/navigation";
import { DevFlagsClient } from "./dev-flags-client";

/**
 * VDP Flag Override Page — Development Only
 *
 * Server Component that guards against production access,
 * then renders the client-side cookie toggle UI.
 */
export default function DevFlagsPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <DevFlagsClient />;
}
