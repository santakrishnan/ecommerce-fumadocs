import type { CompareVehicle } from "../types";

export const TITLE_PREFIX = "Compare ";
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;
export const TITLE_SEPARATOR = " vs ";
export const EMPTY_TITLE = "Compare Vehicles";

const DESCRIPTION_TAIL = " side by side on price, performance, interior, safety, and history.";
const EMPTY_DESCRIPTION = `Compare vehicles${DESCRIPTION_TAIL}`;

/** `{year} {model} {trim}` — the human-readable identity used in SEO copy. */
export function toVehicleLabel(vehicle: CompareVehicle): string {
  const trim = vehicle.trim.trim();
  const base = `${vehicle.year} ${vehicle.model}`;
  return trim ? `${base} ${trim}` : base;
}

/** "Compare A vs B", truncated with " and {n} more" to fit within TITLE_MAX. */
export function buildCompareTitle(labels: string[]): string {
  const [first] = labels;
  if (first === undefined) {
    return EMPTY_TITLE;
  }

  const full = `${TITLE_PREFIX}${labels.join(TITLE_SEPARATOR)}`;
  if (full.length <= TITLE_MAX) {
    return full;
  }

  // Include as many leading labels as fit, omitting the fewest possible.
  for (let omitted = 1; omitted < labels.length; omitted++) {
    const included = labels.length - omitted;
    const candidate = `${TITLE_PREFIX}${labels.slice(0, included).join(TITLE_SEPARATOR)} and ${omitted} more`;
    if (candidate.length <= TITLE_MAX) {
      return candidate;
    }
  }

  // Even the first label alone exceeds the budget — include it in full.
  const remaining = labels.length - 1;
  return remaining > 0 ? `${TITLE_PREFIX}${first} and ${remaining} more` : full;
}

/** Names each label in column order, capped at DESCRIPTION_MAX characters. */
export function buildCompareDescription(labels: string[]): string {
  if (labels.length === 0) {
    return EMPTY_DESCRIPTION;
  }

  const included: string[] = [];
  for (const label of labels) {
    const candidate = `${TITLE_PREFIX}${[...included, label].join(", ")}${DESCRIPTION_TAIL}`;
    if (candidate.length > DESCRIPTION_MAX) {
      break;
    }
    included.push(label);
  }

  if (included.length === 0) {
    return EMPTY_DESCRIPTION;
  }

  return `${TITLE_PREFIX}${included.join(", ")}${DESCRIPTION_TAIL}`;
}
