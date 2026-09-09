import { proxyMediaRequest } from "@shared/lib/media/media-proxy";

/**
 * GET|HEAD /api/v1/media/{...path}
 *
 * Same-origin reverse proxy for the header-gated media CDN. Injects the
 * `X-Origin-Verify` key server-side and streams the asset back, so components
 * can point `next/image` at `/api/v1/media/<path>` and still get optimization
 * and caching without the secret ever reaching the client. See
 * {@link proxyMediaRequest} for status semantics (503/400/502/504/passthrough).
 */

interface RouteContext {
  params: Promise<{ mediaPath: string[] }>;
}

async function handleMediaRequest(request: Request, { params }: RouteContext): Promise<Response> {
  const { mediaPath } = await params;
  return proxyMediaRequest(request, mediaPath);
}

export function GET(request: Request, context: RouteContext): Promise<Response> {
  return handleMediaRequest(request, context);
}

export function HEAD(request: Request, context: RouteContext): Promise<Response> {
  return handleMediaRequest(request, context);
}
