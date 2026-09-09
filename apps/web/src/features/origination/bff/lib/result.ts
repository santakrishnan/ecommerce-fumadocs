/**
 * Discriminated result shape shared by every origination BFF use-case.
 *
 * Identical in shape to `getSearchResults` (features/search/bff) — the union is
 * narrowed on `success`, so callers branch on `result.success` and TypeScript
 * refines `data` / `error` accordingly. Use-cases return `Result<T, E>` (never
 * throw) so route handlers and Server Actions can map failures to typed HTTP
 * responses without try/catch at the call site.
 *
 * @example
 * const result = await patchOrigination(request, traceId, identity);
 * if (!result.success) {
 *   return originationErrorResponse(result.error, traceId);
 * }
 * return NextResponse.json(result.data);
 */
export type Result<T, E> = { success: true; data: T } | { success: false; error: E };
