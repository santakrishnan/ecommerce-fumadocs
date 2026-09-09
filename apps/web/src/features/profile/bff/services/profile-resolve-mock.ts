import "server-only";

import { RESOLVED_VISITOR_FIXTURE } from "../__fixtures__/profile-resolve.fixture";
import type { ResolvedVisitor } from "../contracts/profile-resolve-response";

export async function mockProfileResolve(_fingerprintId: string): Promise<ResolvedVisitor> {
  return RESOLVED_VISITOR_FIXTURE;
}
