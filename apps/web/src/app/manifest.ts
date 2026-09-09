import type { MetadataRoute } from "next";

/**
 * Web App Manifest — typed replacement for the legacy `manifest.json`.
 * Keeps the source of truth colocated with `metadata` in `layout.tsx`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UCMP",
    short_name: "UCMP",
    description: "Used Car Marketplace", //TODO: Need to updated
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/icons/icon.svg", // TODO: added a temp placeholder image replace it valid one
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
