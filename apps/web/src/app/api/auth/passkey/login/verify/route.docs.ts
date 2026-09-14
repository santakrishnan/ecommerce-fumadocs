import type { AuthenticationResponseJSON } from "@features/auth/passkey/contract";
import { mockRpRoute } from "@features/auth/passkey/mock-server/handler";
import { authenticationVerify } from "@features/auth/passkey/mock-server/server";

/** POST AuthenticationResponseJSON → { user, credential }. Dev-only MOCK — replace with the upstream BED (see mock-server/server.ts). */
export const POST = mockRpRoute((request, body) =>
  authenticationVerify(request, body as AuthenticationResponseJSON)
);
