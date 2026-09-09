"use server";

import { rm } from "node:fs/promises";
import { AGENT_DEBUG_DEV, DEBUG_SEARCH_DIR } from "@features/search/bff/lib/agent-debug-storage";
import { revalidatePath } from "next/cache";

/**
 * Delete every captured trace. Invoked from the /debug/agent index. Removes the
 * entire `.debug/search` tree (a gitignored dev directory); the recorder
 * recreates it on the next capture.
 *
 * Guarded on development — not on the capture flag — so old captures can still
 * be cleared after capture is switched off. No-ops outside development, since
 * Server Actions aren't covered by the /debug layout's notFound guard.
 */
export async function clearAgentTracesAction(): Promise<void> {
  if (!AGENT_DEBUG_DEV) {
    return;
  }
  await rm(DEBUG_SEARCH_DIR, { force: true, recursive: true });
  revalidatePath("/debug/agent");
}
