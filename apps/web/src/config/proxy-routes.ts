import "server-only";

/**
 * Route registry for proxy handler — defines which routes can be proxied.
 * Each entry maps an API path to its configuration.
 */
export interface ProxyRouteConfig {
  /** Cache profile: landing, profile, detail, search, or none */
  cacheProfile?: "landing" | "profile" | "detail" | "search" | "none";
  /** Name of the feature this route belongs to */
  feature: string;
  /** HTTP methods allowed for this route (GET, POST, and DELETE are supported by the proxy) */
  methods: ("GET" | "POST" | "DELETE")[];
  /** Path pattern (without /api prefix) */
  path: string;
}

export type ProxyMethod = "GET" | "POST" | "DELETE";

export interface MatchedProxyRoute {
  params: Record<string, string>;
  route: ProxyRouteConfig;
}

/**
 * Registry of routes that are eligible for proxy forwarding.
 * Incoming requests are validated against this allowlist.
 *
 * NOTE: Include only routes intended to be forwarded by the v1 catch-all proxy
 * when an upstream service is configured.
 *
 * Currently empty — all v1 routes use dedicated handlers with mock services
 * and direct upstream calls. Add entries here only for routes that need
 * zero-transformation passthrough to the upstream API.
 */
const proxyRoutes: ProxyRouteConfig[] = [
  {
    feature: "watchlist",
    methods: ["POST"],
    path: "/watchlist",
  },
  {
    feature: "watchlist",
    methods: ["DELETE"],
    path: "/watchlist/:vin",
  },
];

/**
 * Find route config matching the given path and method.
 * Supports basic path patterns with :id placeholders.
 */
export function findRouteConfig(pathname: string, method: string): ProxyRouteConfig | undefined {
  return matchProxyRoute(pathname, method)?.route;
}

/**
 * Match a route and return extracted dynamic parameters.
 */
export function matchProxyRoute(pathname: string, method: string): MatchedProxyRoute | undefined {
  const normalizedMethod = method.toUpperCase() as ProxyMethod;

  for (const route of proxyRoutes) {
    if (!route.methods.includes(normalizedMethod)) {
      continue;
    }

    const pathSegments = pathname.split("/").filter(Boolean);
    const routeSegments = route.path.split("/").filter(Boolean);

    if (pathSegments.length !== routeSegments.length) {
      continue;
    }

    const params: Record<string, string> = {};
    let matched = true;

    for (let i = 0; i < routeSegments.length; i += 1) {
      const routeSegment = routeSegments[i];
      const pathSegment = pathSegments[i] ?? "";

      if (!routeSegment) {
        matched = false;
        break;
      }

      if (routeSegment.startsWith(":")) {
        params[routeSegment.slice(1)] = decodeURIComponent(pathSegment);
        continue;
      }

      if (routeSegment !== pathSegment) {
        matched = false;
        break;
      }
    }

    if (matched) {
      return { route, params };
    }
  }

  return;
}

/**
 * Validate that a pathname and method are allowed in the registry.
 */
export function validateProxyRoute(
  pathname: string,
  method: string
): { valid: true } | { valid: false; reason: string } {
  const route = findRouteConfig(pathname, method);

  if (!route) {
    return {
      valid: false,
      reason: `Route ${method} ${pathname} is not registered for proxying`,
    };
  }

  return { valid: true };
}
