/**
 * Typed wrapper for the View Transitions API with feature detection.
 *
 * The View Transitions API is not yet in the standard TypeScript DOM lib,
 * so we use a typed interface and guard with feature detection.
 */

interface DocumentWithViewTransition {
  startViewTransition(callback: () => void): { finished: Promise<void> };
}

/**
 * Execute a callback within a View Transition if the API is available.
 * Falls back to an instant update when the API is unavailable.
 *
 * @param update - Callback to execute inside the view transition
 *
 * @example
 * startViewTransitionIfAvailable(() => {
 *   router.push(href);
 * });
 */
export function startViewTransitionIfAvailable(update: () => void): void {
  if (typeof document === "undefined") {
    update();
    return;
  }

  if (!("startViewTransition" in document)) {
    update();
    return;
  }

  (document as unknown as DocumentWithViewTransition).startViewTransition(update);
}
