// Static image module declarations for Next.js static imports.
//
// next-env.d.ts (which references next/image-types/global) is gitignored and
// only generated at runtime by Next.js. These declarations let bare `tsc` in
// CI resolve `@public/*` imports without a Next.js build.
//
// This file intentionally has NO `export {}` — keeping it a TypeScript
// "script" (non-module) file ensures the `declare module` blocks are treated
// as unambiguous global ambient module declarations, not module-scoped ones.
//
// The StaticImageData shape is inlined to avoid a Next.js type dependency
// inside an ambient declaration block.

interface StaticImageData {
  blurDataURL?: string;
  blurHeight?: number;
  blurWidth?: number;
  height: number;
  src: string;
  width: number;
}

declare module "*.png" {
  const content: StaticImageData;
  export default content;
}

declare module "*.jpg" {
  const content: StaticImageData;
  export default content;
}

declare module "*.jpeg" {
  const content: StaticImageData;
  export default content;
}

declare module "*.webp" {
  const content: StaticImageData;
  export default content;
}

declare module "*.svg" {
  const content: StaticImageData;
  export default content;
}
