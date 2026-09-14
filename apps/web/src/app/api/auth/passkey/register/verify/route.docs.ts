import type { RegistrationResponseJSON } from "@features/auth/passkey/contract";
import { mockRpRoute } from "@features/auth/passkey/mock-server/handler";
import { registrationVerify } from "@features/auth/passkey/mock-server/server";

/** POST RegistrationResponseJSON → { user, credential }. Dev-only MOCK — replace with the upstream BED (see mock-server/server.ts). */
export const POST = mockRpRoute((request, body) =>
  registrationVerify(request, body as RegistrationResponseJSON)
);
