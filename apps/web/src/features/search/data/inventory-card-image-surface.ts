/**
 * Per-image text-contrast surface for the 16 inventory-card images.
 * FE-only — not part of the SDK wire contract.
 */
export const INVENTORY_CARD_IMAGE_SURFACES: ReadonlyArray<"light" | "dark"> = [
  "light", // 01
  "light", // 02
  "light", // 03
  "light", // 04
  "light", // 05
  "dark", // 06
  "dark", // 07
  "dark", // 08
  "light", // 09
  "dark", // 10
  "dark", // 11
  "dark", // 12
  "dark", // 13
  "dark", // 14
  "light", // 15
  "light", // 16
];

const IMAGE_COUNT = INVENTORY_CARD_IMAGE_SURFACES.length;

/** Matches the trailing image number in `/inventory-card/inventory-card-NN.png`. */
const IMAGE_NUMBER_RE = /inventory-card-(\d+)\.png$/;

/** Returns the light/dark surface for a 1-indexed inventory-card image number. */
export function surfaceForImageNumber(imageNumber: number): "light" | "dark" {
  const index = (((imageNumber - 1) % IMAGE_COUNT) + IMAGE_COUNT) % IMAGE_COUNT;
  return INVENTORY_CARD_IMAGE_SURFACES[index] ?? "light";
}

/** Derives the FE surface from an inventory-card image URL. Returns undefined if no match. */
export function deriveInventoryCardSurface(imageUrl?: string): "light" | "dark" | undefined {
  if (!imageUrl) {
    return;
  }

  const match = imageUrl.match(IMAGE_NUMBER_RE);
  const captured = match?.[1];
  if (!captured) {
    return;
  }

  return surfaceForImageNumber(Number.parseInt(captured, 10));
}
