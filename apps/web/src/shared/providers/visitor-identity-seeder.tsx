import "server-only";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import { HydrateVisitorIdentity } from "./visitor-provider";

/**
 * Server-side seed for the visitor identity: reads the httpOnly
 * `_ucmp_visitor_id` / `_ucmp_session_id` cookies and hands them to the client
 * `VisitorProvider`, so a warm visitor's IndexedDB partition uses their real id
 * from the first client render — no waiting for the keep-alive `/resolve`.
 *
 * Reads request cookies, so it must render inside a `<Suspense>` boundary to
 * stay a dynamic hole and keep the layout's static shell intact.
 */
export async function VisitorIdentitySeeder() {
  const { visitorId = null, sessionId = null } = await readVisitorIdentity();

  // Cold visit — no identity cookie yet; the keep-alive patches it after resolve.
  if (!(visitorId || sessionId)) {
    return null;
  }

  return <HydrateVisitorIdentity sessionId={sessionId} visitorId={visitorId} />;
}
