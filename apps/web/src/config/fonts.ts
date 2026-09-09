import localFont from "next/font/local";

/**
 * ToyotaType Font Family
 *
 * Configured using next/font/local for optimal loading performance:
 * - Automatic font optimization
 * - Zero layout shift
 * - Self-hosted (no external requests)
 * - Preloaded for better performance
 */
export const toyotaType = localFont({
  src: [
    {
      path: "../../public/fonts/ToyotaType-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/ToyotaType-LightIt.ttf",
      weight: "300",
      style: "italic",
    },
    /**
     * "Book" weight (350) is non-standard but intentional — ToyotaType ships
     * this as a distinct cut between Light (300) and Regular (400). Because we
     * declare it in an explicit @font-face via next/font/local, the browser
     * will deterministically serve this file when `font-weight: 350` is
     * requested. All evergreen browsers handle this correctly.
     *
     * Tailwind has no built-in class for 350; use the custom `font-book`
     * utility defined in globals.css, or the arbitrary value `font-[350]`.
     */
    {
      path: "../../public/fonts/ToyotaType-Book.ttf",
      weight: "350",
      style: "normal",
    },
    {
      path: "../../public/fonts/ToyotaType-BookIt.ttf",
      weight: "350",
      style: "italic",
    },
    {
      path: "../../public/fonts/ToyotaType-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/ToyotaType-RegularIt.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/ToyotaType-Semibold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/ToyotaType-SemiboldIt.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../../public/fonts/ToyotaType-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/ToyotaType-BoldIt.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../../public/fonts/ToyotaType-Black.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../../public/fonts/ToyotaType-BlackIt.ttf",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-app-sans",
  display: "swap",
  preload: true,
});
