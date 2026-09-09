import type { ResolveVehicleImageInput, VehicleImageEntry, VehicleImageGrade } from "./types";
import { vehicleImageManifest } from "./vehicle-image-manifest";

// ─── Fallback images (model-aware) ────────────────────────────────────────────
// Instead of generic body-type placeholders, fallbacks use the default image
// from a representative model in the manifest for each body type.
// These paths are resolved lazily from the manifest. The static array below is
// kept only as an emergency fallback if the manifest is somehow empty.

type BodyType = "sedan" | "car" | "suv" | "truck";

/**
 * Representative model per body type used for fallback resolution.
 * The fallback image is pulled from the first grade of each representative model.
 */
const FALLBACK_MODEL_BY_BODY_TYPE: Record<BodyType, { make: string; model: string }> = {
  sedan: { make: "Toyota", model: "Camry" },
  car: { make: "Toyota", model: "Corolla" },
  suv: { make: "Toyota", model: "4Runner" },
  truck: { make: "Toyota", model: "Tacoma" },
};

/**
 * Known model → body type classification.
 * Used when the model name is available but no manifest entry exists.
 */
const MODEL_BODY_TYPE: Record<string, BodyType> = {
  // Trucks
  tacoma: "truck",
  tundra: "truck",
  "f-150": "truck",
  f150: "truck",
  silverado: "truck",
  ram: "truck",
  ranger: "truck",
  frontier: "truck",
  colorado: "truck",
  maverick: "truck",
  ridgeline: "truck",
  titan: "truck",
  gladiator: "truck",
  sierra: "truck",
  // SUVs / Crossovers
  "c-hr": "suv",
  chr: "suv",
  "4runner": "suv",
  highlander: "suv",
  rav4: "suv",
  sequoia: "suv",
  "land cruiser": "suv",
  landcruiser: "suv",
  venza: "suv",
  "corolla cross": "suv",
  corollacross: "suv",
  "grand highlander": "suv",
  explorer: "suv",
  "santa fe": "suv",
  telluride: "suv",
  pilot: "suv",
  tahoe: "suv",
  suburban: "suv",
  wrangler: "suv",
  bronco: "suv",
  defender: "suv",
  cx5: "suv",
  "cx-5": "suv",
  tucson: "suv",
  sportage: "suv",
  sorento: "suv",
  pathfinder: "suv",
  murano: "suv",
  rogue: "suv",
  crv: "suv",
  "cr-v": "suv",
  hrv: "suv",
  "hr-v": "suv",
  outback: "suv",
  forester: "suv",
  bz4x: "suv",
  // Sedans
  camry: "sedan",
  corolla: "sedan",
  avalon: "sedan",
  accord: "sedan",
  civic: "sedan",
  altima: "sedan",
  sentra: "sedan",
  malibu: "sedan",
  sonata: "sedan",
  elantra: "sedan",
  k5: "sedan",
  legacy: "sedan",
  mazda3: "sedan",
  impreza: "sedan",
  prius: "sedan",
  crown: "sedan",
  mirai: "sedan",
  "crown signia": "suv",
  "toyota crown signia": "suv",
  // Hatchbacks / Compacts → "car"
  "gr corolla": "car",
  grcorolla: "car",
  "corolla hatchback": "car",
  corollahatchback: "car",
  yaris: "car",
  gr86: "car",
  "gr supra": "car",
  grsupra: "car",
  supra: "car",
  miata: "car",
  "86": "car",
  brz: "car",
  // Minivans → "suv" (closest available fallback)
  sienna: "suv",
  odyssey: "suv",
  pacifica: "suv",
  carnival: "suv",
};

/**
 * Keywords found in card titles/context that hint at body type.
 * Checked when no explicit model match is found.
 */
const BODY_TYPE_KEYWORDS: [RegExp, BodyType][] = [
  [/\btruck/i, "truck"],
  [/\bpickup/i, "truck"],
  [/\bcab\b/i, "truck"],
  [/\bsuv/i, "suv"],
  [/\bcrossover/i, "suv"],
  [/\bminivan/i, "suv"],
  [/\bvan\b/i, "suv"],
  [/\bsedan/i, "sedan"],
  [/\bhatchback/i, "car"],
  [/\bcoupe/i, "car"],
  [/\bsport/i, "car"],
  [/\bconvertible/i, "car"],
  [/\bwagon/i, "car"],
  [/\bhybrid\b/i, "sedan"],
  [/\belectric/i, "sedan"],
  [/\bev\b/i, "sedan"],
];

/** Checks a string against body type keyword patterns. */
function matchKeyword(text: string): BodyType | undefined {
  for (const [pattern, type] of BODY_TYPE_KEYWORDS) {
    if (pattern.test(text)) {
      return type;
    }
  }
  return;
}

/** Classifies a model name to a body type via direct/partial lookup. */
function classifyModel(model: string): BodyType | undefined {
  const normalizedModel = model
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .trim();

  const directMatch = MODEL_BODY_TYPE[normalizedModel];
  if (directMatch) {
    return directMatch;
  }

  for (const [key, type] of Object.entries(MODEL_BODY_TYPE)) {
    if (normalizedModel.includes(key) || key.includes(normalizedModel)) {
      return type;
    }
  }

  return;
}

/**
 * Infers body type from model name and/or contextual hints.
 * Returns undefined if no inference can be made.
 *
 * Priority order:
 *  1. Explicit body type hint that directly maps (e.g. "truck", "suv")
 *  2. Model name classification (direct or partial match in MODEL_BODY_TYPE)
 *  3. Keyword patterns in bodyTypeHint (e.g. "hybrid", "pickup")
 *  4. Keyword patterns in model name
 *
 * This ensures a known model like "Tacoma Hybrid" resolves to "truck" via model
 * classification rather than incorrectly matching the "hybrid" keyword → "sedan".
 */
function inferBodyType(model?: string, bodyTypeHint?: string): BodyType | undefined {
  // 1. Explicit hint that is already a known body type key
  if (bodyTypeHint) {
    const normalized = bodyTypeHint.toLowerCase().trim();
    if (normalized in FALLBACK_MODEL_BY_BODY_TYPE) {
      return normalized as BodyType;
    }
  }

  // 2. Model name classification (most reliable signal)
  if (model) {
    const fromModel = classifyModel(model);
    if (fromModel) {
      return fromModel;
    }
  }

  // 3. Try classifying bodyTypeHint as a model name (card mappers pass model names here)
  if (bodyTypeHint) {
    const fromHint = classifyModel(bodyTypeHint);
    if (fromHint) {
      return fromHint;
    }
  }

  // 4. Keyword patterns in bodyTypeHint
  if (bodyTypeHint) {
    const keywordMatch = matchKeyword(bodyTypeHint);
    if (keywordMatch) {
      return keywordMatch;
    }
  }

  // 5. Keyword patterns in model name
  if (model) {
    return matchKeyword(model);
  }

  return;
}

// getContextualFallback is defined below, after manifest setup (needs entriesByModel)

/**
 * @deprecated Use `getContextualFallback()` for dynamic resolution.
 * Kept for backwards-compatible export — defaults to the 4Runner (SUV) default.
 */
const FALLBACK_IMAGE = "/vehicles/toyota/fallback_suv.webp";

// ─── Manifest setup ───────────────────────────────────────────────────────────

const entries: VehicleImageEntry[] = vehicleImageManifest;

function normalize(value: string | undefined): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function modelKey(make: string, model: string): string {
  return `${normalize(make)}::${normalize(model)}`;
}

const entriesByModel = new Map<string, VehicleImageEntry[]>();
for (const entry of entries) {
  const key = modelKey(entry.make, entry.model);
  const bucket = entriesByModel.get(key);
  if (bucket) {
    bucket.push(entry);
  } else {
    entriesByModel.set(key, [entry]);
  }
}

const MODEL_ALIASES: Record<string, string> = {
  crown: "Toyota Crown",
  crownsignia: "Toyota Crown Signia",
  rav4prime: "RAV4 Plug-in Hybrid",
  priusprime: "Prius Plug-in Hybrid",
  bz4x: "bZ",
  supra: "GR Supra",
  "86": "GR86",
};

const HYBRID_SUFFIXES = [" plug-in hybrid", " plugin hybrid", " hybrid"];

function stripHybridSuffix(model: string): string {
  const lower = model.toLowerCase().trimEnd();
  for (const suffix of HYBRID_SUFFIXES) {
    if (lower.endsWith(suffix)) {
      return model.slice(0, lower.length - suffix.length).trim();
    }
  }
  return model;
}

function modelCandidates(model: string): string[] {
  const candidates = [model];

  const withoutHybrid = stripHybridSuffix(model);
  if (withoutHybrid && withoutHybrid !== model) {
    candidates.push(withoutHybrid);
  }

  const alias = MODEL_ALIASES[normalize(model)];
  if (alias) {
    candidates.push(alias);
  }

  return candidates;
}

/**
 * Returns a model-appropriate fallback image by looking up a representative
 * model from the manifest for the inferred body type.
 *
 * Priority:
 *  1. If model name matches a manifest entry directly → use that model's default image
 *     (e.g. "Tundra Hybrid" → strips suffix → finds Tundra → Tundra image).
 *  2. Infer body type → use the representative model for that body type
 *     (e.g. unknown truck → Tacoma image, unknown SUV → 4Runner image).
 *  3. Ultimate fallback: Camry's default image.
 */
function getContextualFallback(model?: string, bodyTypeHint?: string): string {
  // Try to find the model in the manifest directly (handles hybrid suffix stripping)
  if (model) {
    for (const candidate of modelCandidates(model)) {
      const bucket = entriesByModel.get(modelKey("Toyota", candidate));
      if (bucket?.[0]?.grades[0]?.image) {
        return bucket[0].grades[0].image;
      }
    }
  }

  // Try bodyTypeHint as a model name (card mappers often pass model names here)
  if (bodyTypeHint) {
    for (const candidate of modelCandidates(bodyTypeHint)) {
      const bucket = entriesByModel.get(modelKey("Toyota", candidate));
      if (bucket?.[0]?.grades[0]?.image) {
        return bucket[0].grades[0].image;
      }
    }
  }

  // Infer body type and use the representative model's image
  const bodyType = inferBodyType(model, bodyTypeHint);
  if (bodyType) {
    const rep = FALLBACK_MODEL_BY_BODY_TYPE[bodyType];
    const bucket = entriesByModel.get(modelKey(rep.make, rep.model));
    if (bucket?.[0]?.grades[0]?.image) {
      return bucket[0].grades[0].image;
    }
  }

  // Ultimate fallback — first Camry grade
  const camryBucket = entriesByModel.get(modelKey("Toyota", "Camry"));
  if (camryBucket?.[0]?.grades[0]?.image) {
    return camryBucket[0].grades[0].image;
  }

  // Should never reach here if manifest is populated, but kept for safety
  return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)] as string;
}

/**
 * Computed fallback images — one per body type, derived from the manifest.
 * Exported for backwards compatibility. Prefer `getContextualFallback()`.
 */
const FALLBACK_IMAGES: readonly string[] = Object.values(FALLBACK_MODEL_BY_BODY_TYPE)
  .map((rep) => {
    const bucket = entriesByModel.get(modelKey(rep.make, rep.model));
    return bucket?.[0]?.grades[0]?.image;
  })
  .filter((img): img is string => Boolean(img));

function pickEntry(make: string, model: string, year?: number): VehicleImageEntry | undefined {
  for (const candidate of modelCandidates(model)) {
    const bucket = entriesByModel.get(modelKey(make, candidate));
    if (!bucket || bucket.length === 0) {
      continue;
    }
    if (year !== undefined) {
      const exactYear = bucket.find((entry) => entry.year === year);
      if (exactYear) {
        return exactYear;
      }
    }
    return bucket[0];
  }
  return;
}

function matchGrade(
  entry: VehicleImageEntry,
  trim: string | undefined
): VehicleImageGrade | undefined {
  if (entry.grades.length === 0) {
    return;
  }
  if (trim) {
    const normalizedTrim = normalize(trim);
    const exact = entry.grades.find((grade) => normalize(grade.gradeName) === normalizedTrim);
    if (exact) {
      return exact;
    }
    const partial = entry.grades.find(
      (grade) =>
        normalizedTrim.includes(normalize(grade.gradeName)) ||
        normalize(grade.gradeName).includes(normalizedTrim)
    );
    if (partial) {
      return partial;
    }
  }
  return entry.grades[0];
}

function matchColorImage(grade: VehicleImageGrade, color: string | undefined): string | undefined {
  if (grade.colors.length === 0) {
    return grade.image;
  }
  if (color) {
    const normalizedColor = normalize(color);
    const byCode = grade.colors.find((entry) => normalize(entry.code) === normalizedColor);
    if (byCode) {
      return byCode.image;
    }
    const byTitle = grade.colors.find((entry) => normalize(entry.title).includes(normalizedColor));
    if (byTitle) {
      return byTitle.image;
    }
    // Color specified but not found — return grade default
    return grade.image;
  }
  // No color specified — randomize from available colors for visual variety
  const randomColor = grade.colors[Math.floor(Math.random() * grade.colors.length)];
  return randomColor?.image ?? grade.image;
}

function resolveVehicleImage(input: ResolveVehicleImageInput): string {
  const { make, model, year, trim, color, bodyType } = input;
  if (!(make && model)) {
    return getContextualFallback(model, bodyType);
  }
  const entry = pickEntry(make, model, year);
  if (!entry) {
    return getContextualFallback(model, bodyType);
  }
  const grade = matchGrade(entry, trim);
  if (!grade) {
    return getContextualFallback(model, bodyType);
  }
  return matchColorImage(grade, color) ?? getContextualFallback(model, bodyType);
}

function getVehicleImageEntry(
  make: string,
  model: string,
  year?: number
): VehicleImageEntry | undefined {
  return pickEntry(make, model, year);
}

function listVehicleImageEntries(): VehicleImageEntry[] {
  return entries;
}

export {
  FALLBACK_IMAGE,
  FALLBACK_IMAGES,
  getContextualFallback,
  getVehicleImageEntry,
  listVehicleImageEntries,
  resolveVehicleImage,
};
