import type { ResolvedVisitor } from "../contracts/profile-resolve-response";

export const RESOLVED_VISITOR_FIXTURE: ResolvedVisitor = {
  visitorId: "visitor-123",
  sessionId: "session-456",
  deviceId: "device-789",
  isNew: false,
  customerId: "customer-321",
  firstSeenAt: "2026-06-01T12:00:00.000Z",
  lastSeenAt: "2026-07-06T09:30:00.000Z",
};
