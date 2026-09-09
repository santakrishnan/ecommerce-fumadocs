/// <reference types="@testing-library/jest-dom" />
// vi must be imported directly from vitest (not re-exported through test-utils)
// so that vi.hoisted / vi.mock resolve correctly after Vitest's hoist transform.

import { describe, expect, it, render, screen } from "@ucmp/vitest-config/test-utils";
import { vi } from "vitest";

// vi.hoisted runs before any module imports — gives us a stable reference
// we can pass into vi.mock without triggering "before initialization" errors.
const mockVehicle360Viewer = vi.hoisted(() => vi.fn().mockReturnValue(null));

vi.mock("@ucmp/vehicle-360", () => ({
  Vehicle360Viewer: mockVehicle360Viewer,
}));

import { GalleryTabBar } from "../components/image-gallery/gallery-tab-bar";

const RE_360_VIEW = /360° view/i;

const DEFAULT_PROPS = {
  defaultImageAlt: "Toyota Highlander exterior",
  defaultImageUrl: "/images/car.jpg",
  threeSixtyManifestUrl: null,
} as const;

describe("GalleryTabBar", () => {
  // ─── Tab rendering ──────────────────────────────────────────────────────

  describe("tab rendering", () => {
    it("renders a single '360° view' tab trigger", () => {
      render(<GalleryTabBar {...DEFAULT_PROPS} />);
      expect(screen.getByRole("tab", { name: RE_360_VIEW })).toBeInTheDocument();
    });

    it("the 360° view tab is selected by default", () => {
      render(<GalleryTabBar {...DEFAULT_PROPS} />);
      expect(screen.getByRole("tab", { name: RE_360_VIEW })).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });

    it("renders a single tab list", () => {
      render(<GalleryTabBar {...DEFAULT_PROPS} />);
      expect(screen.getAllByRole("tablist")).toHaveLength(1);
    });
  });

  // ─── Manifest URL absent ─────────────────────────────────────────────────

  describe("when threeSixtyManifestUrl is null", () => {
    it("does not render the 360° viewer", () => {
      render(<GalleryTabBar {...DEFAULT_PROPS} />);
      expect(mockVehicle360Viewer).not.toHaveBeenCalled();
    });
  });

  // ─── Manifest URL present ────────────────────────────────────────────────

  describe("when threeSixtyManifestUrl is provided", () => {
    const MANIFEST_URL = "/api/v1/vehicles/4T1G11AK1NU038415/360";

    it("renders Vehicle360Viewer with the correct manifest URL", () => {
      render(<GalleryTabBar {...DEFAULT_PROPS} threeSixtyManifestUrl={MANIFEST_URL} />);
      expect(mockVehicle360Viewer).toHaveBeenCalledWith(
        expect.objectContaining({ manifestUrl: MANIFEST_URL }),
        undefined
      );
    });

    it("passes showHotspots=true to show all hotspot types combined", () => {
      render(<GalleryTabBar {...DEFAULT_PROPS} threeSixtyManifestUrl={MANIFEST_URL} />);
      expect(mockVehicle360Viewer).toHaveBeenCalledWith(
        expect.objectContaining({ showHotspots: true }),
        undefined
      );
    });

    it("does not pass hotspotTypeFilter so all hotspot types are visible", () => {
      render(<GalleryTabBar {...DEFAULT_PROPS} threeSixtyManifestUrl={MANIFEST_URL} />);
      expect(mockVehicle360Viewer).toHaveBeenCalledWith(
        expect.not.objectContaining({ hotspotTypeFilter: expect.anything() }),
        undefined
      );
    });
  });
});
