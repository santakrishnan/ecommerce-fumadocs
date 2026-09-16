import { mockRpRoute } from "@features/auth/passkey/mock-server/handler";
import { listPasskeys } from "@features/auth/passkey/mock-server/server";

/** GET → PasskeyCredentialSummary[] for the signed-in user. Dev-only MOCK — replace with the upstream BED (see mock-server/server.ts). */
export const GET = mockRpRoute(() => listPasskeys());
