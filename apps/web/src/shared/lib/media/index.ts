// Client-safe public surface. The server-only proxy (`proxyMediaRequest`) and
// config (`resolveMediaUpstream`) are imported by path from server callers so a
// client component importing this barrel never pulls in `server-only`.

export {
  extractMediaSortKey,
  resolveHeroImageUrl,
  sortMediaByFilenamePrefix,
} from "./media-sort";
export { normalizeImageUrl } from "./normalize-image-url";
