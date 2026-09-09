// ---------------------------------------------------------------------------
// Spec Normalization — version-agnostic helpers shared by v1 and v2
// ---------------------------------------------------------------------------

const LEADING_TILDE_RE = /^~/;
const NON_NUMERIC_RE = /[^0-9.]/g;

/**
 * Formats the avgMileage spec value: strips the leading tilde and trailing
 * unit suffix, strips commas, rounds to the nearest 50, and re-formats with a
 * thousands separator. Returns undefined when the value is absent or
 * non-numeric so the spec row is omitted rather than showing garbage.
 */
function formatAvgMileage(raw: string | undefined): string | undefined {
  if (!raw) {
    return;
  }
  // Strip leading tilde and trailing non-numeric suffix (e.g. " mi")
  const stripped = raw.replace(LEADING_TILDE_RE, "").replace(NON_NUMERIC_RE, "");
  const parsed = Number.parseFloat(stripped);
  if (!Number.isFinite(parsed)) {
    return;
  }
  const rounded = Math.round(parsed / 50) * 50;
  return rounded.toLocaleString("en-US");
}

/**
 * Applies display-layer normalization to a spec array sourced from the upstream
 * payload. Currently handles avgMileage formatting; add further per-key rules
 * here as needed.
 */
export function normalizeSpecs(specs: unknown[]): unknown[] {
  return specs.map((spec) => {
    if (typeof spec !== "object" || spec === null) {
      return spec;
    }
    const s = spec as Record<string, unknown>;
    if (s.key === "avgMileage") {
      return { ...s, value: formatAvgMileage(s.value as string | undefined) };
    }
    return s;
  });
}
