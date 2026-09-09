import { LINKED_TIERS } from "@config/profile-tier";
import { decodeVisitorId } from "@features/fingerprint/bff/fingerprint-cookie";
import { FINGERPRINT_ID_COOKIE } from "@features/fingerprint/constants";
import { cookies } from "next/headers";
import { getProfileResolve } from "../bff/use-cases/get-profile-resolve";
import { getProfileTier } from "../bff/use-cases/get-profile-tier";
import { MEMBER_YEAR, MOCK_MEMBER_ID } from "./member-id-card-constants";
import { MemberIdCardContent } from "./member-id-card-content";

/**
 * Server component wrapper for the Member ID Card.
 *
 * Fetches profile data (tier, year, isLinked) and delegates
 * rendering to MemberIdCardContent. Drop this in wherever the skeleton
 * MemberIdCard was rendered.
 */
export async function MemberIdCardWrapper() {
  const tier = await getProfileTier();

  const cookieStore = await cookies();
  const fpToken = cookieStore.get(FINGERPRINT_ID_COOKIE)?.value;
  const fingerprintId = fpToken ? (decodeVisitorId(fpToken) ?? "") : "";

  const result = fingerprintId
    ? await getProfileResolve(fingerprintId)
    : { success: false as const };

  const year =
    result.success && result.data.firstSeenAt
      ? String(new Date(result.data.firstSeenAt).getFullYear())
      : MEMBER_YEAR;

  const isLinked = LINKED_TIERS.has(tier);

  // Use customerId when available (T2/T3), fall back to visitorId from resolve,
  // then to fingerprintId as last resort (the visitor's identity signal).
  // For demo purposes, use a mock ID when tier is T1+ but no real identity is available.
  // QR code only shows for members (T1+), never for anonymous T0.
  const isMember = tier !== "t0";

  let memberId: string | undefined;
  if (!isMember) {
    memberId = undefined;
  } else if (result.success && result.data.customerId) {
    memberId = result.data.customerId;
  } else if (result.success && result.data.visitorId) {
    memberId = result.data.visitorId;
  } else if (fingerprintId) {
    memberId = fingerprintId;
  } else {
    memberId = MOCK_MEMBER_ID;
  }

  return <MemberIdCardContent isLinked={isLinked} memberId={memberId} tier={tier} year={year} />;
}
