// @vitest-environment node
import { normalizeImageUrl } from "@shared/lib/media";
import { afterEach, describe, expect, it, vi } from "vitest";

const MEDIA_HOST = "https://media.sandbox.arrow.toyotafinancial.com";
const FALLBACK = "/inventory-card/default.png";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("normalizeImageUrl", () => {
  describe("empty / missing", () => {
    it("returns the default fallback for undefined, empty, and whitespace", () => {
      expect(normalizeImageUrl(undefined)).toBe(FALLBACK);
      expect(normalizeImageUrl("")).toBe(FALLBACK);
      expect(normalizeImageUrl("   ")).toBe(FALLBACK);
    });

    it("honors a custom fallback", () => {
      expect(normalizeImageUrl("", "/dealer/placeholder.png")).toBe("/dealer/placeholder.png");
    });
  });

  describe("localhost fixtures", () => {
    it("strips a localhost origin to a same-origin path", () => {
      expect(normalizeImageUrl("http://localhost:3000/inventory-card/car.png")).toBe(
        "/inventory-card/car.png"
      );
    });

    it("strips 127.0.0.1 and [::1] origins", () => {
      expect(normalizeImageUrl("https://127.0.0.1/x.png")).toBe("/x.png");
      expect(normalizeImageUrl("http://[::1]:3000/x.png")).toBe("/x.png");
    });

    it("falls back when stripping leaves nothing", () => {
      expect(normalizeImageUrl("http://localhost:3000")).toBe(FALLBACK);
    });
  });

  describe("relative media paths", () => {
    it("rewrites a public/ path to the proxy path, dropping the public/ segment", () => {
      expect(normalizeImageUrl("public/9d15/012-abc.jpg")).toBe("/api/v1/media/9d15/012-abc.jpg");
    });

    it("tolerates a leading slash on the public/ path", () => {
      expect(normalizeImageUrl("/public/9d15/012-abc.jpg")).toBe("/api/v1/media/9d15/012-abc.jpg");
    });
  });

  describe("absolute media-host URLs", () => {
    it("rewrites a media-host URL to the proxy path (default host)", () => {
      expect(normalizeImageUrl(`${MEDIA_HOST}/9d15/012-abc.jpg`)).toBe(
        "/api/v1/media/9d15/012-abc.jpg"
      );
    });

    it("preserves the query string (signed URLs)", () => {
      expect(normalizeImageUrl(`${MEDIA_HOST}/9d15/x.jpg?sig=xyz&v=2`)).toBe(
        "/api/v1/media/9d15/x.jpg?sig=xyz&v=2"
      );
    });

    it("matches the media host from NEXT_PUBLIC_MEDIA_CDN_URL when overridden", () => {
      vi.stubEnv("NEXT_PUBLIC_MEDIA_CDN_URL", "https://media.prod.example.com/");
      expect(normalizeImageUrl("https://media.prod.example.com/a/b.jpg")).toBe(
        "/api/v1/media/a/b.jpg"
      );
      // The old default host is now a different domain → passed through untouched.
      expect(normalizeImageUrl(`${MEDIA_HOST}/a/b.jpg`)).toBe(`${MEDIA_HOST}/a/b.jpg`);
    });
  });

  describe("pass-through", () => {
    it("leaves other CDN hosts untouched", () => {
      const other = "https://cdn.inventoryrsc.com/x/y.jpg";
      expect(normalizeImageUrl(other)).toBe(other);
    });

    it("leaves an already-relative app path untouched", () => {
      expect(normalizeImageUrl("/inventory-card/car.png")).toBe("/inventory-card/car.png");
    });
  });
});
