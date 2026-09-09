import { fetchCarCutterManifest } from "@features/vehicle-detail/lib/car-cutter";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
} from "@shared/lib/http/status-codes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { VIN_PATTERN } from "utils/validators";
import { z } from "zod";

const vinParamSchema = z.object({
  vin: z
    .string()
    .transform((v) => v.toUpperCase())
    .pipe(
      z
        .string()
        .regex(VIN_PATTERN, "VIN must be exactly 17 alphanumeric characters (excluding I, O, Q).")
    ),
});

/**
 * GET /api/v1/vehicles/[vin]/360
 *
 * BFF proxy for the Car-Cutter composition_v3 manifest.
 * Fetches the manifest server-side so the CDN URL and gallery hash are never
 * exposed in client bundles or browser network logs.
 *
 * Returns the manifest JSON as-is on success.
 * Returns 404 when Car-Cutter has no 360° data for the VIN or the gallery hash
 * is not configured.
 *
 * Uses the shared fetchCarCutterManifest utility so CDN fetch logic lives in
 * one place (also used server-side during SSR for gallery image pre-loading).
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ vin: string }> }) {
  try {
    const rawParams = await params;
    const parsed = vinParamSchema.safeParse(rawParams);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: { code: "INVALID_VIN", message: parsed.error.issues[0]?.message ?? "Invalid VIN" },
        },
        { status: HTTP_STATUS_BAD_REQUEST }
      );
    }

    const manifest = await fetchCarCutterManifest(parsed.data.vin);

    if (!manifest) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "No 360° data available for this vehicle" } },
        { status: HTTP_STATUS_NOT_FOUND }
      );
    }

    return NextResponse.json(manifest);
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch 360° manifest" } },
      { status: HTTP_STATUS_INTERNAL_SERVER_ERROR }
    );
  }
}
