/**
 * Splits a raw metric string into a numeric value and an optional unit suffix.
 *
 * Examples:
 *  - "84.3 cu. ft." → { value: "84.3", unit: "cu. ft." }
 *  - "$45,000"      → { value: "$45,000", unit: undefined }
 *  - "615 mi"       → { value: "615", unit: "mi" }
 *  - "35"           → { value: "35", unit: undefined }
 *  - "30 min (80%)" → { value: "30", unit: "min (80%)" }
 */
const METRIC_VALUE_RE = /^([^\d]*[\d.,]+)\s*(.*)$/;

export function parseMetricValue(raw: string): { value: string; unit: string | undefined } {
  const match = raw.match(METRIC_VALUE_RE);
  const value = match?.[1] ?? raw;
  const unit = match?.[2] || undefined;
  return { value, unit };
}
