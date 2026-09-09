/// <reference types="@testing-library/jest-dom" />
import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { DetailImageCardProps } from "../detail-image-card";
import { DetailImageCard } from "../detail-image-card";

const BASE_PROPS: DetailImageCardProps = {
  imageAlt: "Vehicle exterior",
  imageUrl: "/images/vehicles/placeholder/exterior.png",
  label: "Midnight Black Metallic",
  size: "large",
};

describe("DetailImageCard", () => {
  describe("Rendering", () => {
    it("renders the primary label as a heading", () => {
      render(<DetailImageCard {...BASE_PROPS} />);
      expect(
        screen.getByRole("heading", { level: 3, name: "Midnight Black Metallic" })
      ).toBeInTheDocument();
    });

    it("renders the background image with correct alt text", () => {
      render(<DetailImageCard {...BASE_PROPS} />);
      const img = screen.getByRole("img", { name: "Vehicle exterior" });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src");
    });

    it("renders optional sub-label when provided", () => {
      render(<DetailImageCard {...BASE_PROPS} subLabel="Exterior color" />);
      expect(screen.getByText("Exterior color")).toBeInTheDocument();
    });

    it("does not render sub-label when not provided", () => {
      render(<DetailImageCard {...BASE_PROPS} />);
      expect(screen.queryByText("Exterior color")).not.toBeInTheDocument();
    });

    it("renders badge with text when provided", () => {
      render(<DetailImageCard {...BASE_PROPS} badge="For You" />);
      expect(screen.getByText("For You")).toBeInTheDocument();
    });

    it("does not render badge when not provided", () => {
      render(<DetailImageCard {...BASE_PROPS} />);
      expect(screen.queryByText("For You")).not.toBeInTheDocument();
    });
  });

  describe("Size variants", () => {
    it("applies large height classes for size='large'", () => {
      const { container } = render(<DetailImageCard {...BASE_PROPS} size="large" />);
      const card = container.querySelector("[data-slot='detail-image-card']");
      expect(card).toHaveClass("h-[22.625rem]");
    });

    it("applies medium height classes for size='medium'", () => {
      const { container } = render(<DetailImageCard {...BASE_PROPS} size="medium" />);
      const card = container.querySelector("[data-slot='detail-image-card']");
      expect(card).toHaveClass("h-[11.1875rem]");
    });
  });

  describe("Surface context", () => {
    it("defaults to data-surface='dark'", () => {
      const { container } = render(<DetailImageCard {...BASE_PROPS} />);
      const card = container.querySelector("[data-slot='detail-image-card']");
      expect(card).toHaveAttribute("data-surface", "dark");
    });

    it("accepts a custom surface prop", () => {
      const { container } = render(<DetailImageCard {...BASE_PROPS} surface="light" />);
      const card = container.querySelector("[data-slot='detail-image-card']");
      expect(card).toHaveAttribute("data-surface", "light");
    });
  });

  describe("data-slot attribute", () => {
    it("has data-slot='detail-image-card'", () => {
      const { container } = render(<DetailImageCard {...BASE_PROPS} />);
      const card = container.querySelector("[data-slot='detail-image-card']");
      expect(card).toBeInTheDocument();
    });
  });

  describe("Action button", () => {
    it("does not render action button by default", () => {
      render(<DetailImageCard {...BASE_PROPS} />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("does not render action button without href", () => {
      render(<DetailImageCard {...BASE_PROPS} showActionButton />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("renders action button when showActionButton and href are provided", () => {
      render(<DetailImageCard {...BASE_PROPS} href="/gallery" showActionButton />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("has contextual aria-label including the card label", () => {
      render(<DetailImageCard {...BASE_PROPS} href="/gallery" showActionButton />);
      expect(
        screen.getByRole("button", { name: "View more Midnight Black Metallic" })
      ).toBeInTheDocument();
    });

    it("renders as a link for Server Component navigation", () => {
      render(<DetailImageCard {...BASE_PROPS} href="/gallery" showActionButton />);
      const button = screen.getByRole("button");
      // Button uses render prop with Link (Server Component pattern)
      expect(button.tagName).toBe("A");
    });
  });

  describe("Link behavior", () => {
    it("renders a link with provided href", () => {
      render(<DetailImageCard {...BASE_PROPS} href="/gallery" />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/gallery");
    });

    it("has aria-label matching the card label", () => {
      render(<DetailImageCard {...BASE_PROPS} href="/gallery" />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("aria-label", "Midnight Black Metallic");
    });

    it("does not render a link when href is omitted", () => {
      render(<DetailImageCard {...BASE_PROPS} />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("does not render a link when href is explicitly undefined", () => {
      render(<DetailImageCard {...BASE_PROPS} href={undefined} />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  describe("Local action trigger (onAction)", () => {
    it("renders a plain button (not a link) for the whole-card trigger when onAction is provided without href", () => {
      const onAction = vi.fn();
      render(<DetailImageCard {...BASE_PROPS} onAction={onAction} />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Midnight Black Metallic" })).toBeInTheDocument();
    });

    it("calls onAction when the whole-card trigger is clicked", async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      render(<DetailImageCard {...BASE_PROPS} onAction={onAction} />);

      await user.click(screen.getByRole("button", { name: "Midnight Black Metallic" }));

      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it("calls onAction when the whole-card trigger is activated by keyboard", async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      render(<DetailImageCard {...BASE_PROPS} onAction={onAction} />);

      await user.tab();
      expect(screen.getByRole("button", { name: "Midnight Black Metallic" })).toHaveFocus();
      await user.keyboard("{Enter}");

      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it("does not render a whole-card trigger when neither href nor onAction is provided", () => {
      render(<DetailImageCard {...BASE_PROPS} />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("prefers href over onAction when both are provided (href wins for navigation)", () => {
      const onAction = vi.fn();
      render(<DetailImageCard {...BASE_PROPS} href="/gallery" onAction={onAction} />);
      expect(screen.getByRole("link")).toHaveAttribute("href", "/gallery");
    });

    it("renders the corner action button as a plain button (not a link) when using onAction", () => {
      const onAction = vi.fn();
      render(<DetailImageCard {...BASE_PROPS} onAction={onAction} showActionButton />);
      const button = screen.getByRole("button", { name: "View more Midnight Black Metallic" });
      expect(button.tagName).toBe("BUTTON");
    });

    it("calls onAction when the corner action button is clicked", async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      render(<DetailImageCard {...BASE_PROPS} onAction={onAction} showActionButton />);

      await user.click(screen.getByRole("button", { name: "View more Midnight Black Metallic" }));

      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it("does not render nested interactive elements (no <a> inside the trigger <button>)", () => {
      const onAction = vi.fn();
      const { container } = render(
        <DetailImageCard {...BASE_PROPS} onAction={onAction} showActionButton />
      );
      for (const button of Array.from(container.querySelectorAll("button"))) {
        expect(button.querySelector("a")).toBeNull();
      }
    });
  });

  describe("Custom className", () => {
    it("merges additional classes onto the card", () => {
      const { container } = render(<DetailImageCard {...BASE_PROPS} className="mt-4" />);
      const card = container.querySelector("[data-slot='detail-image-card']");
      expect(card).toHaveClass("mt-4");
    });
  });

  describe("Priority prop for LCP images", () => {
    it("renders without priority by default", () => {
      render(<DetailImageCard {...BASE_PROPS} />);
      const img = screen.getByRole("img");
      expect(img).toBeInTheDocument();
      // priority defaults to false - no eager loading
    });

    it("accepts priority prop when true", () => {
      // Should not throw when priority is passed
      render(<DetailImageCard {...BASE_PROPS} priority />);
      const img = screen.getByRole("img");
      expect(img).toBeInTheDocument();
    });

    it("accepts priority={false} explicitly", () => {
      render(<DetailImageCard {...BASE_PROPS} priority={false} />);
      const img = screen.getByRole("img");
      expect(img).toBeInTheDocument();
    });
  });

  describe("Gradient overlay", () => {
    it("renders a gradient overlay with aria-hidden", () => {
      const { container } = render(<DetailImageCard {...BASE_PROPS} />);
      const overlay = container.querySelector("[aria-hidden='true']");
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass("pointer-events-none");
      expect(overlay).toHaveClass("h-[43%]");
    });
  });

  describe("Swatch mode", () => {
    const SWATCH_PROPS: DetailImageCardProps = {
      imageAlt: "Exterior color",
      label: "Ruby Red Flare Pearl",
      size: "medium",
      subLabel: "Exterior color",
      swatchColor: "oklch(0.521 0.222 24.3)",
    };

    it("renders in swatch mode when swatchColor is provided and imageUrl is omitted", () => {
      const { container } = render(<DetailImageCard {...SWATCH_PROPS} />);
      const card = container.querySelector("[data-slot='detail-image-card']");
      expect(card).toHaveClass("bg-opacity-black-26");
    });

    it("does not render a background image in swatch mode", () => {
      render(<DetailImageCard {...SWATCH_PROPS} />);
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("does not render the gradient overlay in swatch mode", () => {
      const { container } = render(<DetailImageCard {...SWATCH_PROPS} />);
      const gradientOverlay = container.querySelector(".h-\\[43\\%\\]");
      expect(gradientOverlay).not.toBeInTheDocument();
    });

    it("renders a color swatch circle with aria-hidden", () => {
      const { container } = render(<DetailImageCard {...SWATCH_PROPS} />);
      const swatch = container.querySelector("[aria-hidden='true']");
      expect(swatch).toBeInTheDocument();
      expect(swatch).toHaveClass("rounded-full");
    });

    it("applies the swatchColor as inline background color on the circle", () => {
      const { container } = render(<DetailImageCard {...SWATCH_PROPS} />);
      const swatch = container.querySelector("[aria-hidden='true']");
      expect(swatch).toHaveStyle({ backgroundColor: "oklch(0.521 0.222 24.3)" });
    });

    it("renders the label as a heading", () => {
      render(<DetailImageCard {...SWATCH_PROPS} />);
      expect(
        screen.getByRole("heading", { level: 3, name: "Ruby Red Flare Pearl" })
      ).toBeInTheDocument();
    });

    it("renders the sub-label text", () => {
      render(<DetailImageCard {...SWATCH_PROPS} />);
      expect(screen.getByText("Exterior color")).toBeInTheDocument();
    });

    it("uses justify-between layout for swatch mode content", () => {
      const { container } = render(<DetailImageCard {...SWATCH_PROPS} />);
      const contentWrapper = container.querySelector(".justify-between");
      expect(contentWrapper).toBeInTheDocument();
    });

    it("falls back to image mode when both imageUrl and swatchColor are provided", () => {
      render(<DetailImageCard {...SWATCH_PROPS} imageUrl="/images/exterior.png" />);
      const img = screen.getByRole("img");
      expect(img).toBeInTheDocument();
    });

    it("preserves data-slot in swatch mode", () => {
      const { container } = render(<DetailImageCard {...SWATCH_PROPS} />);
      const card = container.querySelector("[data-slot='detail-image-card']");
      expect(card).toBeInTheDocument();
    });

    it("preserves data-surface in swatch mode", () => {
      const { container } = render(<DetailImageCard {...SWATCH_PROPS} />);
      const card = container.querySelector("[data-slot='detail-image-card']");
      expect(card).toHaveAttribute("data-surface", "dark");
    });

    it("applies medium height classes in swatch mode", () => {
      const { container } = render(<DetailImageCard {...SWATCH_PROPS} />);
      const card = container.querySelector("[data-slot='detail-image-card']");
      expect(card).toHaveClass("h-[11.1875rem]");
    });
  });

  describe("Swatch image mode (texture fallback)", () => {
    const TEXTURE_PROPS: DetailImageCardProps = {
      imageAlt: "Interior color",
      label: "Glazed Caramel",
      size: "medium",
      subLabel: "Interior",
      swatchImageUrl: "/images/textures/glazed-caramel.jpg",
    };

    it("renders in swatch mode when swatchImageUrl is provided without swatchColor", () => {
      const { container } = render(<DetailImageCard {...TEXTURE_PROPS} />);
      const card = container.querySelector("[data-slot='detail-image-card']");
      expect(card).toHaveClass("bg-opacity-black-26");
    });

    it("renders a texture circle with background-image style", () => {
      const { container } = render(<DetailImageCard {...TEXTURE_PROPS} />);
      const swatch = container.querySelector("[aria-hidden='true']");
      expect(swatch).toHaveStyle({
        backgroundImage: "url(/images/textures/glazed-caramel.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      });
    });

    it("does not render a background <img> in texture swatch mode", () => {
      render(<DetailImageCard {...TEXTURE_PROPS} />);
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("prefers swatchColor over swatchImageUrl when both are provided", () => {
      const { container } = render(<DetailImageCard {...TEXTURE_PROPS} swatchColor="#1A1A1A" />);
      const swatch = container.querySelector("[aria-hidden='true']");
      expect(swatch).toHaveStyle({ backgroundColor: "#1A1A1A" });
    });

    it("falls back to image mode when imageUrl is also provided", () => {
      render(<DetailImageCard {...TEXTURE_PROPS} imageUrl="/images/interior.png" />);
      const img = screen.getByRole("img");
      expect(img).toBeInTheDocument();
    });
  });
});
