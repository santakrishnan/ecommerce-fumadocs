import { connection } from "next/server";
import { buildBrandCss } from "~/docs/brands";

/**
 * Serves a brand's token overrides as a stylesheet for the preview iframe
 * (`/preview/[name]?brand=acme`). Development-only, like every `.docs.` route.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ brand: string }> }) {
  await connection();
  const { brand } = await params;
  const css = buildBrandCss(brand);
  if (css === null) {
    return new Response("Unknown brand", { status: 404 });
  }
  return new Response(css, {
    headers: { "Content-Type": "text/css; charset=utf-8", "Cache-Control": "no-store" },
  });
}
