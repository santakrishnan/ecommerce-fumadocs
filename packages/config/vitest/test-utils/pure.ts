/**
 * Pure, DOM-free test helpers. Unlike `./index.ts`, this module does NOT
 * re-export `@testing-library/react` or `@testing-library/user-event` —
 * both register global `afterEach`/`afterAll` hooks at import time that
 * dereference `window`/`document`, which throws under the `node` Vitest
 * environment (`ReferenceError`/`TypeError: window is not defined`).
 *
 * Pure-node test files (`// @vitest-environment node`) that only need a
 * helper like `firstOf` should import it from here instead of
 * `@ucmp/vitest-config/test-utils`, so they never pay for — or crash on —
 * jsdom-only setup they don't use.
 */

/**
 * Returns the element at `index` from an array, throwing if the position is
 * empty. Use in tests where a missing element is itself a test failure.
 *
 * Satisfies both `noNonNullAssertion` and `noUncheckedIndexedAccess` without
 * type erasure — the returned value keeps the array's element type.
 */
export function firstOf<T>(arr: readonly T[], index = 0): T {
  const val = arr[index];
  if (val === undefined) {
    throw new Error(
      `Expected element at index ${String(index)}, but array has ${String(arr.length)} items`
    );
  }
  return val;
}
