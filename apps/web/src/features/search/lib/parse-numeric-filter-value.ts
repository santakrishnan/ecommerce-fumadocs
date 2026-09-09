export function parseNumericFilterValue(value: string): number | null {
  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue) {
    return null;
  }

  const numericPart = Number.parseFloat(normalizedValue.replace(/[^\d.]/g, ""));

  if (Number.isNaN(numericPart)) {
    return null;
  }

  if (normalizedValue.includes("k")) {
    return numericPart * 1000;
  }

  if (normalizedValue.includes("m")) {
    return numericPart * 1_000_000;
  }

  return numericPart;
}
