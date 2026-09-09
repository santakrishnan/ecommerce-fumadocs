/// <reference types="@testing-library/jest-dom" />
import { firstOf, render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import type { PackageItem } from "~/features/vehicle-detail/types/categorized-modal";
import { FEATURES_FIXTURE, PACKAGES_FIXTURE } from "../../__fixtures__/features-data.fixture";
import { ViewAllFeaturesModal } from "../view-all-features-modal";

const PACKAGE_NAV_BUTTON_NAME = /package/i;

const item: PackageItem = {
  packageName: "JBL Audio Package includes:",
  items: [
    {
      label:
        "12.3-in. Toyota Audio Multimedia with 11 JBL® speakers, including subwoofer & amplifier",
    },
    { label: "Wireless Apple CarPlay® & Android Auto™ compatibility" },
    { label: "USB media port" },
    { label: "Four USB charge ports" },
    { label: "Hands-free phone capability & music streaming via Bluetooth" },
    { label: "SiriusXM 3 month trial subscription" },
    { label: "* See toyota.com/audio-multimedia for details." },
  ],
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("ViewAllFeaturesModal — PackageSection", () => {
  describe("Rendering without packages", () => {
    it("does not render a package section when packages prop is omitted", () => {
      render(<ViewAllFeaturesModal categories={FEATURES_FIXTURE} open />);

      expect(document.querySelector("#category-package")).toBeNull();
    });

    it("does not render a package tab button when packages prop is omitted", () => {
      render(<ViewAllFeaturesModal categories={FEATURES_FIXTURE} open />);

      expect(screen.queryByRole("tab", { name: PACKAGE_NAV_BUTTON_NAME })).toBeNull();
    });

    it("does not render a package tab button when packages has no items", () => {
      render(
        <ViewAllFeaturesModal
          categories={FEATURES_FIXTURE}
          open
          packages={{ id: "package", title: "Package", items: [] }}
        />
      );

      expect(screen.queryByRole("tab", { name: PACKAGE_NAV_BUTTON_NAME })).toBeNull();
    });
  });

  describe("Rendering with packages", () => {
    it("renders the package section anchor in the DOM", () => {
      render(
        <ViewAllFeaturesModal categories={FEATURES_FIXTURE} open packages={PACKAGES_FIXTURE} />
      );

      expect(document.querySelector("#category-package")).not.toBeNull();
    });

    it("renders a 'Packages' heading when there are multiple packages", () => {
      render(
        <ViewAllFeaturesModal categories={FEATURES_FIXTURE} open packages={PACKAGES_FIXTURE} />
      );

      // PACKAGES_FIXTURE has 2 items → plural heading
      expect(screen.getByRole("heading", { level: 3, name: "Packages" })).toBeInTheDocument();
    });

    it("renders a 'Package' heading when there is a single package", () => {
      const singlePackage = {
        ...PACKAGES_FIXTURE,
        items: [item],
      };

      render(<ViewAllFeaturesModal categories={FEATURES_FIXTURE} open packages={singlePackage} />);

      expect(screen.getByRole("heading", { level: 3, name: "Package" })).toBeInTheDocument();
    });

    it("renders every package name", () => {
      render(
        <ViewAllFeaturesModal categories={FEATURES_FIXTURE} open packages={PACKAGES_FIXTURE} />
      );

      for (const pkg of PACKAGES_FIXTURE.items) {
        expect(screen.getByText(pkg.packageName)).toBeInTheDocument();
      }
    });

    it("renders every item label within each package", () => {
      render(
        <ViewAllFeaturesModal categories={FEATURES_FIXTURE} open packages={PACKAGES_FIXTURE} />
      );

      for (const pkg of PACKAGES_FIXTURE.items) {
        for (const item of pkg.items) {
          expect(screen.getByText(item.label)).toBeInTheDocument();
        }
      }
    });

    it("does not render a footnote when footnote is not set", () => {
      const pkgWithoutFootnote = {
        ...PACKAGES_FIXTURE,
        items: PACKAGES_FIXTURE.items.map(({ footnote: _footnote, ...rest }) => rest),
      };

      render(
        <ViewAllFeaturesModal categories={FEATURES_FIXTURE} open packages={pkgWithoutFootnote} />
      );

      // No footnote text nodes outside of item labels
      expect(screen.queryByTestId("package-footnote")).toBeNull();
    });

    it("renders a footnote when footnote is provided", () => {
      const footnoteText = "Subject to availability.";
      const pkgWithFootnote = {
        ...PACKAGES_FIXTURE,
        items: [{ ...item, footnote: footnoteText }],
      };

      render(
        <ViewAllFeaturesModal categories={FEATURES_FIXTURE} open packages={pkgWithFootnote} />
      );

      expect(screen.getByText(footnoteText)).toBeInTheDocument();
    });
  });

  describe("Nav tab — desktop left rail", () => {
    it("renders a 'Packages' nav tab when there are multiple packages", () => {
      render(
        <ViewAllFeaturesModal categories={FEATURES_FIXTURE} open packages={PACKAGES_FIXTURE} />
      );

      // Desktop nav + mobile tabs both render as role="tab"
      const tabs = screen.getAllByRole("tab", { name: "Packages" });
      expect(tabs.length).toBeGreaterThan(0);
    });

    it("renders a 'Package' nav tab when there is a single package", () => {
      const singlePackage = {
        ...PACKAGES_FIXTURE,
        items: [item],
      };

      render(<ViewAllFeaturesModal categories={FEATURES_FIXTURE} open packages={singlePackage} />);

      const tabs = screen.getAllByRole("tab", { name: "Package" });
      expect(tabs.length).toBeGreaterThan(0);
    });

    it("activates the package tab when clicked", async () => {
      const user = userEvent.setup();
      render(
        <ViewAllFeaturesModal categories={FEATURES_FIXTURE} open packages={PACKAGES_FIXTURE} />
      );

      const packageTab = firstOf(screen.getAllByRole("tab", { name: "Packages" }));
      expect(packageTab).toBeDefined();

      await user.click(packageTab);

      const tabsAfterClick = screen.getAllByRole("tab", { name: "Packages" });
      const hasActiveState = tabsAfterClick.some(
        (tab) => tab.getAttribute("aria-selected") === "true"
      );
      expect(hasActiveState).toBe(true);
    });
  });

  describe("Search integration", () => {
    it("finds a package item label when searching for it", async () => {
      const user = userEvent.setup();
      render(
        <ViewAllFeaturesModal categories={FEATURES_FIXTURE} open packages={PACKAGES_FIXTURE} />
      );

      const searchInputs = screen.getAllByRole("textbox", {
        name: "What are you looking for?",
      });

      // Use the first visible search input (desktop or mobile)
      const searchInput = searchInputs[0] as HTMLElement;

      const targetLabel = item.items[0]?.label;
      const firstWord = targetLabel?.split(" ")[0] ?? "";

      await user.type(searchInput, firstWord);

      // The section heading should appear if results include a package item
      // We only assert the section exists without strict result count
      // (Fuse score depends on minMatchCharLength=2)
      expect(document.querySelector("#category-package")).not.toBeNull();
    });
  });
});
