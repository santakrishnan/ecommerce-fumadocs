import type { PasskeyRenameInput } from "@features/auth/passkey/contract";
import { mockRpRoute } from "@features/auth/passkey/mock-server/handler";
import { renamePasskey, revokePasskey } from "@features/auth/passkey/mock-server/server";

interface Context {
  params: Promise<{ id: string }>;
}

/** PATCH { nickname } → PasskeyCredentialSummary. Dev-only MOCK — replace with the upstream BED (see mock-server/server.ts). */
export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  return mockRpRoute((_req, body) => renamePasskey(id, body as PasskeyRenameInput))(request);
}

/** DELETE → { revokedId, remainingIds }. Dev-only MOCK — replace with the upstream BED (see mock-server/server.ts). */
export async function DELETE(request: Request, context: Context) {
  const { id } = await context.params;
  return mockRpRoute(() => revokePasskey(id))(request);
}
