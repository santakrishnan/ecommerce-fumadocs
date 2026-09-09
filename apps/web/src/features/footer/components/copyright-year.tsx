"use client";

/**
 * CopyrightYear - Renders the current year dynamically.
 * Client Component to avoid Next.js prerender restrictions on `new Date()`.
 */
export function CopyrightYear() {
  return <>{new Date().getFullYear()}</>;
}
