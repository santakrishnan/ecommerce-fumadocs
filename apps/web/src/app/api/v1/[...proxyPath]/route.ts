import { proxyRequest } from "@shared/lib";
import type { NextRequest } from "next/server";

/**
 * Transitional migration route.
 */

interface ProxyRouteContext {
  params: Promise<{
    proxyPath: string[];
  }>;
}

function toProxyPath(proxyPath: string[] | undefined): string {
  return `/${proxyPath?.join("/") ?? ""}`;
}

export async function GET(request: NextRequest, context: ProxyRouteContext) {
  const { proxyPath } = await context.params;
  return proxyRequest(request, toProxyPath(proxyPath));
}

export async function POST(request: NextRequest, context: ProxyRouteContext) {
  const { proxyPath } = await context.params;
  return proxyRequest(request, toProxyPath(proxyPath));
}

export async function DELETE(request: NextRequest, context: ProxyRouteContext) {
  const { proxyPath } = await context.params;
  return proxyRequest(request, toProxyPath(proxyPath));
}
