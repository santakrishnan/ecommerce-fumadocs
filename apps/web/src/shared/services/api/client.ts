import "server-only";

/**
 * Shared backend HTTP client — the single configured transport the whole app
 * uses to reach our backend (one base URL + one auth identity).
 *
 * Layering: `shared/lib/http` is the generic, upstream-agnostic factory
 * (`createServerClient` — retries, timeouts, auth plumbing). THIS file is a
 * configured *instance* of that factory bound to our backend. Library vs.
 * configured instance — like `axios` vs. `axios.create({ baseURL })`. That is
 * why it lives in `shared/services/` (the consuming layer) and not inside
 * `shared/lib/http` (the library, which must stay domain-free and portable).
 *
 * Every feature imports this one client and writes its OWN use cases against
 * its OWN endpoints (landing → /recommendations/today, search → /search, …),
 * so auth / retry / baseUrl config never drifts across features.
 *
 * Auth attaches HERE, once: service credentials are env-read (not request
 * context), so configuring them is legal even though callers may sit inside a
 * `"use cache"` chain. Per-request values (cookies, tracking IDs) never live
 * here — each feature reads them at its front door and passes them as
 * arguments at the call site.
 *
 * To activate: uncomment, and add API_BASE_URL / API_BEARER_TOKEN / API_KEY
 * to the server-only environment (never `NEXT_PUBLIC_*`).
 */

// import { createServerClient } from "@shared/lib/http";
//
// export const apiClient = createServerClient({
//   baseUrl: process.env.API_BASE_URL ?? "",
//   // → `Authorization: Bearer <token>` on every request. The function form
//   //   re-resolves per attempt, so token rotation just works.
//   authToken: () => process.env.API_BEARER_TOKEN,
//   // → custom key header, if the backend requires one alongside the bearer.
//   apiKey: { headerName: "x-api-key", value: () => process.env.API_KEY },
//   serviceName: "API",
//   retries: 2,
//   // Tracking-ID key → outgoing header name. Declares the mapping only —
//   // the values arrive per request via the `ids` option at each call site.
//   headerMap: {
//     sessionId: "x-session-id",
//     visitorId: "x-visitor-id",
//   },
// });
