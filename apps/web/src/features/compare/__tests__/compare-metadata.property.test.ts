// @vitest-environment node
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  buildCompareDescription,
  buildCompareTitle,
  DESCRIPTION_MAX,
  TITLE_MAX,
  TITLE_PREFIX,
  TITLE_SEPARATOR,
} from "../lib/compare-metadata";

// Labels use an uppercase alphanumeric charset so they never collide with the
// lowercase copy in the prefix/tail or the lowercase " vs " / " and N more" join
// tokens, keeping the formatted output unambiguous to parse.
const LABEL_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");

// Realistic vehicle labels ("2024 Camry XSE") are short: a few space-joined tokens.
const shortLabel = fc
  .array(
    fc
      .array(fc.constantFrom(...LABEL_CHARS), { minLength: 1, maxLength: 8 })
      .map((c) => c.join("")),
    { minLength: 1, maxLength: 4 }
  )
  .map((tokens) => tokens.join(" "));

// Very long labels (well beyond the 60-char title budget) exercise truncation and
// the "first label included in full" path.
const longLabel = fc
  .array(fc.constantFrom(...LABEL_CHARS), { minLength: 61, maxLength: 120 })
  .map((c) => c.join(""));

// Bias toward realistic labels while still generating the occasional very long one.
const labelArb = fc.oneof(shortLabel, shortLabel, shortLabel, longLabel);
const labelsArb = fc.array(labelArb, { minLength: 1, maxLength: 6 });

const TITLE_SUFFIX_RE = / and (\d+) more$/;

describe("buildCompareTitle formatting and length bound", () => {
  // Feature: compare-seo-structured-data, Property 1: Title formatting and length bound
  it("prefixes, orders, separates, and truncates labels within the length bound", () => {
    fc.assert(
      fc.property(labelsArb, (labels) => {
        const title = buildCompareTitle(labels);
        const firstLabel = labels[0] as string;

        // Begins with the "Compare " prefix.
        expect(title.startsWith(TITLE_PREFIX)).toBe(true);

        const rest = title.slice(TITLE_PREFIX.length);
        const suffixMatch = rest.match(TITLE_SUFFIX_RE);
        const omittedCount = suffixMatch ? Number(suffixMatch[1]) : 0;
        const core = suffixMatch ? rest.slice(0, rest.length - suffixMatch[0].length) : rest;

        const included = core.length === 0 ? [] : core.split(TITLE_SEPARATOR);

        // Included labels appear in original order, separated only by " vs ".
        expect(included).toEqual(labels.slice(0, included.length));
        expect(core.startsWith(TITLE_SEPARATOR)).toBe(false);
        expect(core.endsWith(TITLE_SEPARATOR)).toBe(false);

        // The " and {count} more" suffix appears exactly when not every label fits,
        // and {count} equals the number of omitted labels.
        expect(suffixMatch !== null).toBe(included.length < labels.length);
        expect(omittedCount).toBe(labels.length - included.length);

        if ((TITLE_PREFIX + firstLabel).length <= TITLE_MAX) {
          // Whenever the prefix + first label fits, the whole title fits.
          expect(title.length).toBeLessThanOrEqual(TITLE_MAX);
        } else {
          // Otherwise the first label is still included in full.
          expect(included[0]).toBe(firstLabel);
        }
      }),
      { numRuns: 25 }
    );
  });
});

describe("buildCompareDescription naming and length bound", () => {
  // Feature: compare-seo-structured-data, Property 2: Description names labels within the length bound
  it("stays within the length bound and names the included labels in column order", () => {
    fc.assert(
      fc.property(labelsArb, (labels) => {
        const description = buildCompareDescription(labels);

        // Never exceeds the description length budget.
        expect(description.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
        expect(description.startsWith(TITLE_PREFIX)).toBe(true);

        // Discover the leading labels the description actually names, in order.
        let cursor = TITLE_PREFIX.length;
        let matched = 0;
        for (const label of labels) {
          const idx = description.indexOf(label, cursor);
          if (idx < 0) {
            break;
          }
          cursor = idx + label.length;
          matched++;
        }

        // Whatever labels are included appear contiguously, comma-separated, in
        // their original column order right after the prefix.
        if (matched > 0) {
          expect(description.startsWith(TITLE_PREFIX + labels.slice(0, matched).join(", "))).toBe(
            true
          );
        }
      }),
      { numRuns: 25 }
    );
  });
});
