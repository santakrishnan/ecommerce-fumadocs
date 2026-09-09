import { fn } from "storybook/test"
import type { Meta, StoryObj } from "@storybook/react"

import { GradientImage } from "@/components/gradient-image"

/**
 * GradientImage — renders an image within a fixed aspect-ratio frame.
 *
 * When the image does not fill the frame vertically, the remaining area is
 * filled with a gradient sampled from the image's bottom edge for a seamless
 * visual transition.
 *
 * ## Color resolution
 *
 * `onColorSampled` always receives a normalized `oklch(...)` string. The color
 * can originate from pixel sampling, the `overrideColor` prop, or the fallback,
 * and may be a `var(--token)` reference. GradientImage resolves the variable
 * from the element's cascade and normalizes other color spaces (theme tokens
 * compile to `lab()`/hex) to `oklch(...)` before calling back — see the
 * `concreteColorToOklch` / `cssColorToRgb` helpers under `Foundation/Util/CSS Color`.
 *
 * ## Exported helper utilities
 *
 * The following functions are also exported from `@ucmp/ui` for standalone use:
 *
 * | Function | Description |
 * | --- | --- |
 * | `sampleBottomAverageColor(img, options?)` | Samples the bottom strip of an `HTMLImageElement` and returns an OKLCH CSS color string. |
 * | `averageRgbFromPixelData(data)` | Computes an alpha-weighted average RGB from raw `Uint8ClampedArray` pixel data. Returns `null` if all pixels are transparent. |
 * | `concreteColorToOklch(value)` | Normalizes a concrete CSS color (`oklch()`, `rgb()`, `lab()`, hex, named) to an `oklch(...)` string. |
 * | `cssColorToRgb(value)` | Rasterizes any paintable CSS color to an `{ r, g, b }` triplet via canvas. |
 * | `rgbToOklch(rgb)` | Converts an `{ r, g, b }` triplet (0–255) to an `OklchColor` object. |
 * | `toOklchCss(oklch)` | Formats an `OklchColor` as a CSS `oklch(...)` string. |
 * | `toRgbCss(rgb)` | Formats an `RgbColor` as a CSS `rgb(...)` string. |
 * | `DEFAULT_BOTTOM_COLOR_CSS` | The fallback color (`var(--color-neutral-600)`) used when sampling fails. |
 */
const meta = {
  title: "Components/GradientImage",
  component: GradientImage,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onColorSampled: fn(),
  },
  argTypes: {
    src: {
      description: "Image source URL (used with native `<img>` mode)",
      control: "text",
      table: { type: { summary: "string" } },
    },
    alt: {
      description: "Alternate text for the image (used with native `<img>` mode)",
      control: "text",
      table: { type: { summary: "string" } },
    },
    image: {
      description: "Custom image element (e.g. `next/image` with `fill`). Replaces `src`/`alt`.",
      control: false,
      table: { type: { summary: "ReactElement" } },
    },
    aspectRatio: {
      control: "text",
      description: "Target aspect ratio as `w/h` string (e.g. `\"16/9\"`, `\"4/3\"`) or a number",
      table: { type: { summary: "string | number" }, defaultValue: { summary: '"3/4"' } },
    },
    imageClassName: {
      description: "Classes applied on the native `<img>` element",
      control: "text",
      table: { type: { summary: "string" } },
    },
    sampleHeightRatio: {
      control: { type: "number", min: 0.01, max: 1, step: 0.01 },
      description: "Fraction of image height sampled from the bottom edge",
      table: { type: { summary: "number" }, defaultValue: { summary: "0.14" } },
    },
    minImageHeightPercent: {
      control: { type: "number", min: 0, max: 100, step: 1 },
      description:
        "Minimum share of the frame height the image box must occupy. Higher values force a taller image area and shrink the gradient band.",
      table: { type: { summary: "number" }, defaultValue: { summary: "0" } },
    },
    blendHeightPercent: {
      control: { type: "number", min: 0, max: 100, step: 1 },
      description: "Blend gradient height as % of the image box",
      table: { type: { summary: "number" }, defaultValue: { summary: "10" } },
    },
    showGradient: {
      control: "boolean",
      description: "Force the bottom gradient overlay to render even when the image fills the frame; sampling stays unchanged",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    fallbackColor: {
      description: "Fallback CSS color before sampling or if sampling fails",
      control: "text",
      table: { type: { summary: "string" }, defaultValue: { summary: "var(--color-neutral-600)" } },
    },
    overrideColor: {
      description:
        "Explicit color for the bottom gradient/filler. Checked with a defined-check (`!== undefined`), so an empty string is a valid override. When set, image sampling is skipped entirely and the value is used immediately as the CSS custom property — including on subsequent prop changes. `onColorSampled` is still called with this value after every successful image load.",
      control: "color",
      table: { type: { summary: "string" } },
    },
    onColorSampled: {
      description:
        "Callback fired after every successful image load with a normalized `oklch(...)` color string. The color can originate from pixel sampling, the `overrideColor` prop, or the fallback; `var(--token)` references and other color spaces (e.g. `lab()`) are resolved to `oklch(...)` before the callback fires.",
      table: { type: { summary: "(color: string) => void" } },
    },
  },
} satisfies Meta<typeof GradientImage>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A wide landscape image placed in a portrait frame.
 * The filler area below the image is colored by the sampled bottom edge.
 */
export const LandscapeInPortraitFrame: Story = {
  name: "Landscape in Portrait Frame",
  args: {
    src: "/images/mock-car-image.jpg",
    alt: "Wide landscape image in a portrait frame",
    aspectRatio: "3/4",
    className: "w-[448px]",
  },
}

/**
 * A square-ish image in a tall portrait frame — the filler adapts to the
 * dominant bottom color.
 */
export const SquareInPortraitFrame: Story = {
  name: "Square in Portrait Frame",
  args: {
    src: "/images/rubber-duck.webp",
    alt: "Rubber ducks image with yellow bottom gradient",
    aspectRatio: "3/4",
    className: "w-[448px]",
  },
}

/** When the image matches the frame ratio, no gradient or filler is shown. */
export const ImageFillsFrame: Story = {
  name: "Image Fills Frame",
  args: {
    src: "/images/rubber-duck.webp",
    alt: "Image that matches the frame ratio — no sampling occurs",
    aspectRatio: "1/1",
    className: "w-[448px]",
  },
}

/** When requested, the blend overlay can still render even if the image fills the frame. */
export const ForceGradientOverlay: Story = {
  name: "Force Gradient Overlay",
  args: {
    src: "/images/rubber-duck.webp",
    alt: "Image that matches the frame ratio with a forced blend overlay",
    aspectRatio: "1/1",
    showGradient: true,
    className: "w-[448px]",
  },
}

/**
 * Shows how `minImageHeightPercent` makes the image box taller even when the
 * source image would otherwise leave a larger gradient band.
 */
export const MinimumImageHeight: Story = {
  name: "Minimum Image Height",
  args: {
    src: "/images/mock-car-image.jpg",
    alt: "Landscape image with a taller image box and smaller gradient band",
    aspectRatio: "3/4",
    minImageHeightPercent: 72,
    className: "w-[448px]",
  },
}

/** Fallback state — broken image URL shows the neutral theme filler. */
export const Fallback: Story = {
  name: "Fallback (Broken Image)",
  args: {
    src: "/images/this-does-not-exist.jpg",
    alt: "Broken image showing fallback filler",
    aspectRatio: "3/4",
    className: "w-[448px]",
  },
}

/**
 * Demonstrates the `image` prop pattern used in Next.js apps.
 *
 * In production, you'd pass `<Image>` from `next/image` with `fill`, `sizes`,
 * and `priority`. Here we simulate the same composition with a plain `<img>`
 * styled identically to how `next/image fill` renders — proving the sampling
 * and gradient logic works with any image element that fires `onLoad`.
 *
 * In a Next.js app, pass `next/image` via the `image` prop:
 *
 * ```tsx
 * import Image from "next/image";
 *
 * <GradientImage
 *   aspectRatio="448/597"
 *   image={
 *     <Image
 *       src="/photo.jpg"
 *       alt="Product"
 *       fill
 *       sizes="(min-width: 1024px) 448px, 100vw"
 *       priority
 *       className="object-cover object-bottom"
 *     />
 *   }
 * />
 * ```
 */
export const WithCustomImageElement: Story = {
  name: "Custom Image Element (next/image pattern)",
  args: {
    image: (
      <img
        src="/images/mock-car-image.jpg"
        alt="Rubber ducks — rendered via custom image element"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "bottom",
        }}
      />
    ),
    aspectRatio: "3/4",
    className: "w-[448px]",
  },
}

/**
 * Demonstrates the `overrideColor` prop — the filler and gradient use the
 * supplied color directly. No canvas sampling is performed, and
 * `onColorSampled` is still called with the override value once the image loads.
 *
 * Pass `overrideColor` when you already know the color you want for the filler
 * area. The supplied value is used immediately as the CSS custom property.
 * `onColorSampled` is still called with the override value once the image
 * loads, so parent components can stay in sync.
 *
 * ```tsx
 * <GradientImage
 *   src="/photo.jpg"
 *   alt="Product"
 *   aspectRatio="3/4"
 *   overrideColor="var(--color-neutral-500)"
 *   onColorSampled={(color) => ...}
 * />
 * ```
 */
export const WithOverrideColor: Story = {
  name: "Override Color (no sampling)",
  args: {
    src: "/images/mock-car-image.jpg",
    alt: "Rubber ducks — filler color supplied via overrideColor prop",
    aspectRatio: "3/4",
    overrideColor: "var(--color-neutral-500)",
    className: "w-[448px]",
  },
}

