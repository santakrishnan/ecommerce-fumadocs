import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import {
  type DealRouteResponse,
  dealLookupResponseSchema,
  type VehicleDealResponse,
} from "../contracts/vehicle-deal.schema";

export interface GetVehicleDealInput {
  /** Current session identifier forwarded to the upstream Loan Origination API. */
  sessionId?: string;
  /** Canonical visitor identifier forwarded to the upstream Loan Origination API. */
  visitorId?: string;
}

/** Known VINs that resolve to fixture data. Unknown VINs return "not found". */
const KNOWN_FIXTURE_VINS = new Set([
  "JTERU5JR7N6123456", // 4Runner TRD Off Road fixture
  "2T1BURHE8JC039175", // RAV4 Hybrid from search API spec examples
  "4T1DAACK8TU776368",
  "7SVAAABA3RX036689",
]);

/**
 * Fetches loan origination / deal data for a single VIN.
 *
 * Calls the upstream loan origination service to retrieve financing details
 * (monthly payment, term, APR, credit score requirement) for the given vehicle.
 *
 * Currently backed by fixture data — the upstream call is documented inline
 * for the planned backend swap once `LOAN_ORIGINATION_API_URL` is configured.
 */
export async function getVehicleDeal(
  vin: string,
  _input: GetVehicleDealInput = {}
): Promise<DealRouteResponse> {
  // Unknown VINs exercise the "not found" path — no caching needed.
  if (!KNOWN_FIXTURE_VINS.has(vin)) {
    return {
      error: {
        code: "DEAL_NOT_FOUND",
        message: `No deal found for VIN ${vin}`,
      },
    };
  }

  return getCachedVehicleDeal(vin);
}

/**
 * Cached deal/financing resolution.
 *
 * Separated from the main function so `"use cache"` only wraps the
 * data-fetching path (not the "not found" guard). The VIN argument
 * becomes part of the compiler-generated cache key.
 *
 * Uses the `detail` profile: 5-min stale, 5-min revalidate, 1-hr expire.
 */
async function getCachedVehicleDeal(vin: string): Promise<DealRouteResponse> {
  "use cache";
  cacheLife("detail");
  cacheTag("vehicle-deal", `vehicle-deal:${vin}`);

  // ── Planned backend swap ──────────────────────────────────────────────
  // import { createServerClient } from "@shared/lib/http";
  //
  // const loanClient = createServerClient({
  //   baseUrl: process.env.LOAN_ORIGINATION_API_URL!,
  //   apiKey: { headerName: "X-Api-Key", value: process.env.LOAN_ORIGINATION_API_KEY! },
  //   serviceName: "LoanOrigination",
  //   headerMap: { visitorId: "X-Visitor-Id", sessionId: "X-Session-Id" },
  // });
  //
  // const response = await loanClient.get<DealLookupResponse>(
  //   `/vehicles/${vin}/deal`,
  //   { schema: dealLookupResponseSchema }
  // );
  //
  // return response.data;
  // ──────────────────────────────────────────────────────────────────────

  const fixturePayload = buildDealFixturePayload(vin);
  const parsed = dealLookupResponseSchema.safeParse(fixturePayload);

  if (!parsed.success) {
    console.error("[getVehicleDeal] Fixture validation failed", parsed.error.issues);
    return {
      error: {
        code: "DEAL_VALIDATION_FAILED",
        message: "Deal response did not match contract.",
      },
    };
  }

  return parsed.data.data;
}

/**
 * Build a fixture payload mimicking the upstream loan origination service response.
 * Uses the VIN to produce deterministic financing data.
 */
function buildDealFixturePayload(vin: string) {
  return {
    data: {
      vin,
      financing: {
        monthlyPayment: 408,
        totalPrice: 32_490,
        msrp: 36_900,
        termMonths: 60,
        aprPercent: 5.49,
        minCreditScore: 700,
      },
      urgencyMessage: "Act fast, these models usually sell within 5 days",
      buyNowHref: `/vehicle/${vin}/buy`,
    } satisfies VehicleDealResponse,
    meta: {
      traceId: "00-fixture-trace-id-002",
      timestamp: "2026-01-01T00:00:00.000Z",
    },
  };
}
