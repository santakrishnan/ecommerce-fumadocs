export interface BottomStripSamplingOptions {
  /** Fraction of image height to sample from the bottom edge. @default 0.14 */
  sampleHeightRatio?: number;
  /** Max sampling width used for downscaling before reading pixels. @default 160 */
  sampleWidth?: number;
}

/** 8-bit sRGB channels in the [0, 255] range — from pixel data or CSS. */
export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface OklchColor {
  /** Lightness (0-1) */
  l: number;
  /** Chroma (0-~0.4) */
  c: number;
  /** Hue in degrees (0-360) */
  h: number;
}

