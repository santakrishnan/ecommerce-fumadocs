import { mockRpRoute } from "@features/auth/passkey/mock-server/handler";
import { currentUser } from "@features/auth/passkey/mock-server/server";

/** GET → { user | null } from the mock session cookie. Dev-only MOCK — replace with the upstream BED (see mock-server/server.ts). */
export const GET = mockRpRoute(async () => ({ user: await currentUser() }));
