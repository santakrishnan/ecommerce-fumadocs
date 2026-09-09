"use server";

import { TRACKING_COOKIE } from "@ucmp/shared/constants";
import { cookies } from "next/headers";

/**
 * Clears the `_ucmp_recent_return_blocked` cookie. This unblocks the
 * recent-return experience on subsequent home page visits — without a VDP
 * visit, the visitor stays on the first-visit landing even after their session
 * would otherwise qualify as a recent return.
 *
 * Idempotent: no-ops if the cookie is already absent.
 */
export async function unblockRecentReturn(): Promise<void> {
  const cookieStore = await cookies();

  if (!cookieStore.get(TRACKING_COOKIE.RECENT_RETURN_BLOCKED)) {
    return;
  }

  cookieStore.delete(TRACKING_COOKIE.RECENT_RETURN_BLOCKED);
}
