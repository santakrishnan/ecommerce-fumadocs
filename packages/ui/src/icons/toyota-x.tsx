import { createIcon } from "./icon-wrapper";

/**
 * Toyota X brand icon.
 *
 * Original artboard: 64×64. Path scaled to the standard 20×20 icon grid
 * via `transform="scale(0.3125)"` so it fits the shared viewBox without
 * altering the factory or the path coordinates.
 *
 * Inherits color via `currentColor` — style with `text-*` utilities.
 *
 * @example
 * ```tsx
 * import { IconToyotaX } from "@ucmp/ui/icons";
 * <IconToyotaX className="size-5 text-text-primary" />
 * ```
 */
export const IconToyotaX = createIcon(
  "IconToyotaX",
  <g transform="scale(0.3125)">
    <path
      d="M12.2421 14.4968C11.4239 13.0246 13.0474 11.4019 14.5202 12.2198L21.4342 16.0592C28.012 19.7119 36.0102 19.7119 42.5879 16.0592L49.5021 12.2198C50.9749 11.4019 52.5984 13.0246 51.7801 14.4968L47.9389 21.4079C44.2846 27.9827 44.2846 35.9772 47.9389 42.552L51.7571 49.4216C52.5772 50.897 50.9454 52.5211 49.4728 51.6952L42.7881 47.9459C36.2255 44.2651 28.2268 44.2315 21.6334 47.8569L14.4917 51.7837C13.0187 52.5937 11.4033 50.9723 12.2198 49.5033L16.0834 42.5519C19.7376 35.9771 19.7376 27.9827 16.0834 21.408L12.2421 14.4968Z"
      fill="currentColor"
    />
  </g>,
);
