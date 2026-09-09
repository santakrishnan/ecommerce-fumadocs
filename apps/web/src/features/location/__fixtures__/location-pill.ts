import type { LocationPillProps } from "../components/location-pill";

/**
 * Happy-path fixture — server-resolved cookie zip.
 */
export const locationPillDefault: LocationPillProps = {
  zipCode: "10001",
};

/**
 * Custom location fixture — different zip code.
 */
export const locationPillCustom: LocationPillProps = {
  zipCode: "90210",
};

/**
 * First-visit fixture — no cookie yet; the pill renders a skeleton until
 * the client location context resolves.
 */
export const locationPillEmpty: LocationPillProps = {};

/**
 * Edge-case fixture — empty string zip code; treated as "no location".
 */
export const locationPillEmptyString: LocationPillProps = {
  zipCode: "",
};
