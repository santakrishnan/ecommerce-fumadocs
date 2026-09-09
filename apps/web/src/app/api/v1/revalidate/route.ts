import { env } from "@config/env";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * POST /api/v1/revalidate?tag=<tag>&secret=<REVALIDATION_SECRET>
 *
 * Invalidates a tagged cache entry on demand. Tag a cached fetch or RSC
 * via `cacheTag()` then call this route with the tag to force a refresh.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const tag = url.searchParams.get("tag");
  const secret = url.searchParams.get("secret");

  if (!secret || secret !== env.REVALIDATION_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!tag) {
    return NextResponse.json({ ok: false, error: "Missing tag" }, { status: 400 });
  }

  revalidateTag(tag, "max");
  return NextResponse.json({ ok: true, tag });
}
