import { mockRpRoute } from "@features/auth/passkey/mock-server/handler";
import { authenticationOptions } from "@features/auth/passkey/mock-server/server";

/** POST {} → PublicKeyCredentialRequestOptionsJSON (+ challenge cookie). Dev-only MOCK — replace with the upstream BED (see mock-server/server.ts). */
export const POST = mockRpRoute((request) => authenticationOptions(request));
