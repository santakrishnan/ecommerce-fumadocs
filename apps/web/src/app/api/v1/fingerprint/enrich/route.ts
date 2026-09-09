import {
  type EnrichResponse,
  enrichFingerprint,
  enrichRequestSchema,
} from "@features/fingerprint/bff";
import { HTTP_STATUS_BAD_REQUEST } from "@shared/lib/http/status-codes";
import { createLogger } from "@shared/lib/logger";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const log = createLogger("fingerprint-enrich");

/**
 * POST /api/v1/fingerprint/enrich
 *
 * Resolves geolocation from a Fingerprint `requestId` via the Fingerprint
 * Server API, sets the sealed geo + zip cookies, and returns `{ zip, coordinates }`.
 * Decoupled from the Visitor Profile Service — no identity/session work here.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<EnrichResponse | { error: string }>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: HTTP_STATUS_BAD_REQUEST });
  }

  const parsed = enrichRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "requestId is required" },
      { status: HTTP_STATUS_BAD_REQUEST }
    );
  }

  const geo = await enrichFingerprint(parsed.data.requestId);
  log.info("enrich complete", { hasZip: Boolean(geo.zip), hasCoords: Boolean(geo.coordinates) });
  return NextResponse.json<EnrichResponse>(geo);
}
