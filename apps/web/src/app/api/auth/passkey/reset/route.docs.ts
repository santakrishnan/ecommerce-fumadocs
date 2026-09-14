import { mockRpRoute } from "@features/auth/passkey/mock-server/handler";
import { resetDemo } from "@features/auth/passkey/mock-server/server";

/** POST → wipes the mock store and session; returns ids for the Signal API. Dev-only MOCK — replace with the upstream BED (see mock-server/server.ts). */
export const POST = mockRpRoute((request) => resetDemo(request));
