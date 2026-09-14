import type { PasskeyRegisterInput } from "@features/auth/passkey/contract";
import { mockRpRoute } from "@features/auth/passkey/mock-server/handler";
import { registrationOptions } from "@features/auth/passkey/mock-server/server";

/** POST { name, email } → PublicKeyCredentialCreationOptionsJSON (+ challenge cookie). Dev-only MOCK — replace with the upstream BED (see mock-server/server.ts). */
export const POST = mockRpRoute((request, body) =>
  registrationOptions(request, body as PasskeyRegisterInput)
);
