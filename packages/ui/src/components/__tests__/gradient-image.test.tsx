/// <reference types="@testing-library/jest-dom/vitest" />

import { GradientImage } from "@ucmp/ui";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_BOTTOM_COLOR_CSS } from "@/lib";
import * as bottomAverageColor from "@/lib/bottom-strip-sampling";

function dispatchImageLoad(img: HTMLImageElement) {
	act(() => {
		img.dispatchEvent(new Event("load", { bubbles: true }));
	});
}

/**
 * Mock document.createElement to return a fake canvas with a stubbed 2D context,
 * preventing jsdom's "Not implemented: HTMLCanvasElement.getContext()" warning.
 * Mirrors the pattern used in bottom-strip-sampling.test.ts and css-color.test.ts.
 */
function mockCanvas() {
	const fakeContext = {
		drawImage: vi.fn(),
		getImageData: vi.fn().mockReturnValue({
			data: new Uint8ClampedArray([128, 128, 128, 255]),
		}),
	} as unknown as CanvasRenderingContext2D;

	const fakeCanvas = {
		width: 0,
		height: 0,
		getContext: vi.fn().mockReturnValue(fakeContext),
	} as unknown as HTMLCanvasElement;

	vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
		if (tag === "canvas") return fakeCanvas as unknown as HTMLElement;
		return document.createElementNS(
			"http://www.w3.org/1999/xhtml",
			tag,
		) as HTMLElement;
	});

	return { fakeCanvas, fakeContext };
}

// ─── Component tests ────────────────────────────────────────────────────────

describe("GradientImage", () => {
	describe("data-slot attributes", () => {
		it('renders root with data-slot="gradient-image"', () => {
			const { container } = render(
				<GradientImage src="/test.jpg" alt="test" />,
			);
			expect(
				container.querySelector('[data-slot="gradient-image"]'),
			).toBeInTheDocument();
		});

		it('renders frame with data-slot="gradient-image-frame"', () => {
			const { container } = render(
				<GradientImage src="/test.jpg" alt="test" />,
			);
			expect(
				container.querySelector('[data-slot="gradient-image-frame"]'),
			).toBeInTheDocument();
		});

		it('renders media container with data-slot="gradient-image-media"', () => {
			const { container } = render(
				<GradientImage src="/test.jpg" alt="test" />,
			);
			expect(
				container.querySelector('[data-slot="gradient-image-media"]'),
			).toBeInTheDocument();
		});

		it('renders img with data-slot="gradient-image-img"', () => {
			const { container } = render(
				<GradientImage src="/test.jpg" alt="test" />,
			);
			expect(
				container.querySelector('[data-slot="gradient-image-img"]'),
			).toBeInTheDocument();
		});

		it('renders filler with data-slot="gradient-image-filler"', () => {
			const { container } = render(
				<GradientImage src="/test.jpg" alt="test" />,
			);
			expect(
				container.querySelector('[data-slot="gradient-image-filler"]'),
			).toBeInTheDocument();
		});
	});

	describe("native img mode (src + alt)", () => {
		it("renders an img element with the provided src and alt", () => {
			render(<GradientImage src="/photo.jpg" alt="A photo" />);
			const img = screen.getByRole("img", { name: "A photo" });
			expect(img).toHaveAttribute("src", "/photo.jpg");
		});

		it("applies imageClassName to the img element", () => {
			const { container } = render(
				<GradientImage
					src="/photo.jpg"
					alt="test"
					imageClassName="rounded-lg"
				/>,
			);
			const img = container.querySelector('[data-slot="gradient-image-img"]');
			expect(img).toHaveClass("rounded-lg");
		});

		it("sets loading=lazy on the img by default", () => {
			render(<GradientImage src="/photo.jpg" alt="test" />);
			const img = screen.getByRole("img");
			expect(img).toHaveAttribute("loading", "lazy");
		});
	});

	describe("custom image element mode", () => {
		it("renders the custom image element instead of a native img", () => {
			const { container } = render(
				<GradientImage
					image={
						<img src="/custom.jpg" alt="Custom" data-testid="custom-img" />
					}
				/>,
			);
			expect(screen.getByTestId("custom-img")).toBeInTheDocument();
			// Should not have the default data-slot img (the custom one replaces it)
			expect(container.querySelectorAll("img")).toHaveLength(1);
		});

		it("merges onLoad onto the custom image element and fires both callbacks on load", () => {
			mockCanvas();
			const originalOnLoad = vi.fn();
			const onColorSampled = vi.fn();

			const { container } = render(
				<GradientImage
					aspectRatio="3/4"
					onColorSampled={onColorSampled}
					image={<img src="/custom.jpg" alt="Custom" onLoad={originalOnLoad} />}
				/>,
			);

			const img = container.querySelector("img") as HTMLImageElement;

			// Simulate natural dimensions that don't fill the 3/4 frame (wider image)
			Object.defineProperty(img, "naturalWidth", {
				value: 800,
				configurable: true,
			});
			Object.defineProperty(img, "naturalHeight", {
				value: 400,
				configurable: true,
			});

			dispatchImageLoad(img);

			expect(originalOnLoad).toHaveBeenCalledTimes(1);
			expect(onColorSampled).toHaveBeenCalledTimes(1);
			expect(onColorSampled).toHaveBeenCalledWith(expect.any(String));

			vi.restoreAllMocks();
		});
	});

	describe("aspect ratio", () => {
		it('applies string aspect ratio as CSS style (e.g. "16/9" → "16 / 9")', () => {
			const { container } = render(
				<GradientImage src="/test.jpg" alt="test" aspectRatio="16/9" />,
			);
			const root = container.querySelector(
				'[data-slot="gradient-image"]',
			) as HTMLElement;
			expect(root.style.aspectRatio).toBe("16 / 9");
		});

		it("applies numeric aspect ratio as CSS style", () => {
			const { container } = render(
				<GradientImage src="/test.jpg" alt="test" aspectRatio={1.5} />,
			);
			const root = container.querySelector(
				'[data-slot="gradient-image"]',
			) as HTMLElement;
			expect(root.style.aspectRatio).toContain("1.5");
		});

		it('defaults to "3 / 4" when no aspectRatio is provided', () => {
			const { container } = render(
				<GradientImage src="/test.jpg" alt="test" />,
			);
			const root = container.querySelector(
				'[data-slot="gradient-image"]',
			) as HTMLElement;
			expect(root.style.aspectRatio).toBe("3 / 4");
		});
	});

	describe("overrideColor", () => {
		it("uses overrideColor immediately as the gradient color (no image load required)", () => {
			const { container } = render(
				<GradientImage
					src="/test.jpg"
					alt="test"
					overrideColor="var(--color-neutral-500)"
				/>,
			);
			const root = container.querySelector(
				'[data-slot="gradient-image"]',
			) as HTMLElement;
			expect(root.style.getPropertyValue("--gradient-image-color")).toBe(
				"var(--color-neutral-500)",
			);
		});

		it("does not call sampleBottomAverageColor when overrideColor is set", () => {
			const samplerSpy = vi.spyOn(
				bottomAverageColor,
				"sampleBottomAverageColor",
			);
			const onColorSampled = vi.fn();
			const { container } = render(
				<GradientImage
					src="/test.jpg"
					alt="test"
					aspectRatio="3/4"
					overrideColor="var(--color-neutral-500)"
					onColorSampled={onColorSampled}
				/>,
			);

			const img = container.querySelector("img") as HTMLImageElement;
			// Simulate a wide image so the frame has a filler area
			Object.defineProperty(img, "naturalWidth", {
				value: 800,
				configurable: true,
			});
			Object.defineProperty(img, "naturalHeight", {
				value: 400,
				configurable: true,
			});
			dispatchImageLoad(img);

			expect(samplerSpy).not.toHaveBeenCalled();
			// The gradient color must remain the override, not a sampled value
			const root = container.querySelector(
				'[data-slot="gradient-image"]',
			) as HTMLElement;
			expect(root.style.getPropertyValue("--gradient-image-color")).toBe(
				"var(--color-neutral-500)",
			);
		});

		it("calls onColorSampled with overrideColor (not a sampled value) when image loads", () => {
			const onColorSampled = vi.fn();
			document.documentElement.style.setProperty(
				"--color-neutral-500",
				"oklch(80% 0.05 100)",
			);
			const { container } = render(
				<GradientImage
					src="/test.jpg"
					alt="test"
					aspectRatio="3/4"
					overrideColor="var(--color-neutral-500)"
					onColorSampled={onColorSampled}
				/>,
			);

			const img = container.querySelector("img") as HTMLImageElement;
			Object.defineProperty(img, "naturalWidth", {
				value: 800,
				configurable: true,
			});
			Object.defineProperty(img, "naturalHeight", {
				value: 400,
				configurable: true,
			});
			dispatchImageLoad(img);

			expect(onColorSampled).toHaveBeenCalledTimes(1);
			expect(onColorSampled).toHaveBeenCalledWith(
				"oklch(80.00% 0.0500 100.00)",
			);
		});

		it("overrideColor takes precedence over fallbackColor", () => {
			const { container } = render(
				<GradientImage
					src="/test.jpg"
					alt="test"
					fallbackColor="red"
					overrideColor="var(--color-neutral-500)"
				/>,
			);
			const root = container.querySelector(
				'[data-slot="gradient-image"]',
			) as HTMLElement;
			expect(root.style.getPropertyValue("--gradient-image-color")).toBe(
				"var(--color-neutral-500)",
			);
		});

		it("falls back to fallbackColor when overrideColor cannot be resolved", () => {
			const onColorSampled = vi.fn();
			const { container } = render(
				<GradientImage
					src="/test.jpg"
					alt="test"
					aspectRatio="3/4"
					fallbackColor="oklch(42% 0.03 200)"
					overrideColor="var(--missing-color-token)"
					onColorSampled={onColorSampled}
				/>,
			);

			const img = container.querySelector("img") as HTMLImageElement;
			Object.defineProperty(img, "naturalWidth", {
				value: 800,
				configurable: true,
			});
			Object.defineProperty(img, "naturalHeight", {
				value: 400,
				configurable: true,
			});
			dispatchImageLoad(img);

			expect(onColorSampled).toHaveBeenCalledWith(
				"oklch(42.00% 0.0300 200.00)",
			);
		});

		it("treats empty string overrideColor as an explicit override (does not sample)", () => {
			const samplerSpy = vi.spyOn(
				bottomAverageColor,
				"sampleBottomAverageColor",
			);
			const { container } = render(
				<GradientImage
					src="/test.jpg"
					alt="test"
					aspectRatio="3/4"
					overrideColor=""
				/>,
			);

			const img = container.querySelector("img") as HTMLImageElement;
			Object.defineProperty(img, "naturalWidth", {
				value: 800,
				configurable: true,
			});
			Object.defineProperty(img, "naturalHeight", {
				value: 400,
				configurable: true,
			});
			dispatchImageLoad(img);

			expect(samplerSpy).not.toHaveBeenCalled();
			// Empty string is used verbatim as the gradient color
			const root = container.querySelector(
				'[data-slot="gradient-image"]',
			) as HTMLElement;
			expect(root.style.getPropertyValue("--gradient-image-color")).toBe("");
		});

		it("calls onColorSampled even when the image fills the frame (no filler needed)", () => {
			const onColorSampled = vi.fn();
			const { container } = render(
				<GradientImage
					src="/test.jpg"
					alt="test"
					aspectRatio="3/4"
					fallbackColor="oklch(61% 0.06 118)"
					onColorSampled={onColorSampled}
				/>,
			);

			const img = container.querySelector("img") as HTMLImageElement;
			// Tall image that fills a 3/4 frame — naturalWidth/naturalHeight < frameAspectRatio
			Object.defineProperty(img, "naturalWidth", {
				value: 300,
				configurable: true,
			});
			Object.defineProperty(img, "naturalHeight", {
				value: 600,
				configurable: true,
			});
			dispatchImageLoad(img);

			expect(onColorSampled).toHaveBeenCalledTimes(1);
			expect(onColorSampled).toHaveBeenCalledWith(
				"oklch(61.00% 0.0600 118.00)",
			);
		});
	});

	describe("fallback color", () => {
		it("uses DEFAULT_BOTTOM_COLOR_CSS as the initial gradient color", () => {
			const { container } = render(
				<GradientImage src="/test.jpg" alt="test" />,
			);
			const root = container.querySelector(
				'[data-slot="gradient-image"]',
			) as HTMLElement;
			expect(root.style.getPropertyValue("--gradient-image-color")).toBe(
				DEFAULT_BOTTOM_COLOR_CSS,
			);
		});

		it("uses custom fallbackColor when provided", () => {
			const { container } = render(
				<GradientImage src="/test.jpg" alt="test" fallbackColor="green" />,
			);
			const root = container.querySelector(
				'[data-slot="gradient-image"]',
			) as HTMLElement;
			expect(root.style.getPropertyValue("--gradient-image-color")).toBe(
				"green",
			);
		});
	});

	describe("props passthrough", () => {
		it("spreads data-testid onto the root div", () => {
			render(
				<GradientImage src="/test.jpg" alt="test" data-testid="my-gradient" />,
			);
			expect(screen.getByTestId("my-gradient")).toBeInTheDocument();
		});

		it("merges className onto the root div", () => {
			const { container } = render(
				<GradientImage src="/test.jpg" alt="test" className="my-class" />,
			);
			const root = container.querySelector('[data-slot="gradient-image"]');
			expect(root).toHaveClass("my-class");
		});

		it("merges style onto the root div", () => {
			const { container } = render(
				<GradientImage src="/test.jpg" alt="test" style={{ margin: "8px" }} />,
			);
			const root = container.querySelector(
				'[data-slot="gradient-image"]',
			) as HTMLElement;
			expect(root.style.margin).toBe("8px");
		});
	});

	describe("blend gradient visibility", () => {
		it("does not render blend overlay when image fills the frame (100% height)", () => {
			const { container } = render(
				<GradientImage src="/test.jpg" alt="test" />,
			);
			// Before onLoad fires, imageHeightPercent is 100 — no blend
			expect(
				container.querySelector('[data-slot="gradient-image-blend"]'),
			).not.toBeInTheDocument();
		});

		it("renders blend overlay when showGradient is true even if the image fills the frame", () => {
			mockCanvas();
			const { container } = render(
				<GradientImage
					src="/test.jpg"
					alt="test"
					aspectRatio="1/1"
					showGradient
				/>,
			);

			const img = container.querySelector("img") as HTMLImageElement;
			Object.defineProperty(img, "naturalWidth", {
				value: 500,
				configurable: true,
			});
			Object.defineProperty(img, "naturalHeight", {
				value: 500,
				configurable: true,
			});
			dispatchImageLoad(img);

			expect(
				container.querySelector('[data-slot="gradient-image-blend"]'),
			).toBeInTheDocument();
			vi.restoreAllMocks();
		});

		it("samples the image when showGradient is true and the image fills the frame", () => {
			mockCanvas();
			const samplerSpy = vi.spyOn(
				bottomAverageColor,
				"sampleBottomAverageColor",
			);
			const onColorSampled = vi.fn();
			const { container } = render(
				<GradientImage
					src="/test.jpg"
					alt="test"
					aspectRatio="1/1"
					showGradient
					onColorSampled={onColorSampled}
				/>,
			);

			const img = container.querySelector("img") as HTMLImageElement;
			Object.defineProperty(img, "naturalWidth", {
				value: 500,
				configurable: true,
			});
			Object.defineProperty(img, "naturalHeight", {
				value: 500,
				configurable: true,
			});
			dispatchImageLoad(img);

			expect(samplerSpy).toHaveBeenCalled();
			expect(onColorSampled).toHaveBeenCalled();
			expect(
				container.querySelector('[data-slot="gradient-image-blend"]'),
			).toBeInTheDocument();
			vi.restoreAllMocks();
		});
	});

	describe("accessibility", () => {
		it("renders the image with accessible alt text", () => {
			render(<GradientImage src="/photo.jpg" alt="A scenic mountain view" />);
			expect(
				screen.getByRole("img", { name: "A scenic mountain view" }),
			).toBeInTheDocument();
		});

		it("marks the filler as aria-hidden", () => {
			const { container } = render(
				<GradientImage src="/test.jpg" alt="test" />,
			);
			const filler = container.querySelector(
				'[data-slot="gradient-image-filler"]',
			);
			expect(filler).toHaveAttribute("aria-hidden", "true");
		});

		it("does not add interactive ARIA roles or tabindex", () => {
			const { container } = render(
				<GradientImage src="/test.jpg" alt="test" />,
			);
			const root = container.querySelector('[data-slot="gradient-image"]');
			expect(root).not.toHaveAttribute("role");
			expect(root).not.toHaveAttribute("tabindex");
		});
	});
});
