import "server-only";

import { clientEnv } from "@config/client-env";
import { findRouteConfig } from "@config/proxy-routes";
import { cacheLife } from "next/cache";

interface ProxyCacheOptions {
  init?: RequestInit;
  method?: "GET" | "POST";
}

type CacheableProfile = "landing" | "profile" | "detail" | "search";
const SITE_URL = clientEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const CACHEABLE_PROFILES: CacheableProfile[] = ["landing", "profile", "detail", "search"];

function isCacheableProfile(profile: string): profile is CacheableProfile {
  return CACHEABLE_PROFILES.includes(profile as CacheableProfile);
}

/**
 * Map cache profile names to Next.js Cache Components options (in seconds).
 * Based on AGENTS.md cache profiles.
 */
function getCacheOptions(profile: CacheableProfile): {
  stale: number;
  revalidate: number;
  expire: number;
} {
  const profiles: Record<CacheableProfile, { stale: number; revalidate: number; expire: number }> =
    {
      landing: { stale: 900, revalidate: 900, expire: 3600 },
      profile: { stale: 300, revalidate: 600, expire: 3600 },
      detail: { stale: 300, revalidate: 300, expire: 3600 },
      search: { stale: 300, revalidate: 300, expire: 3600 },
    };

  return profiles[profile];
}

/**
 * Helper for Server Components that need proxied data with Cache Components controls.
 */
export async function getProxiedJson<T>(pathname: string, options: ProxyCacheOptions = {}) {
  "use cache";

  const method = options.method ?? "GET";
  const routeConfig = findRouteConfig(pathname, method);

  if (routeConfig?.cacheProfile && isCacheableProfile(routeConfig.cacheProfile)) {
    cacheLife(getCacheOptions(routeConfig.cacheProfile));
  }

  const url = new URL(`/api${pathname}`, SITE_URL);
  const response = await fetch(url, {
    ...options.init,
    method,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Proxy request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}
