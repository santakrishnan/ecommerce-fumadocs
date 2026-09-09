import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const MANIFEST_OUT = join(
  REPO_ROOT,
  "packages",
  "shared",
  "src",
  "vehicle-images",
  "vehicle-image-manifest.ts"
);

const GRAPHQL_URL = "https://orchestrator.configurator.toyota.com/graphql";
const SCENE7_QUERY = "wid=1600&fmt=webp-alpha&cropN=0.07,0.12,0.86,0.62";
const TARGET_ANGLE = "13";

/** Per-series angle overrides when the default TARGET_ANGLE doesn't produce the right perspective. */
const SERIES_ANGLE_OVERRIDE = {
  tacoma: "14",
};

const REQUEST_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  Origin: "https://www.toyota.com",
  Referer: "https://www.toyota.com/configurator/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
};

const YEAR = 2026;
const ZIP = "90001";

const LEADING_SLASH_RE = /^\//;

const PRIMARY_SERIES = ["highlander", "camry", "rav4", "corolla", "corollacross"];
const EXTENDED_SERIES = [
  "rav4pluginhybrid",
  "bz",
  "bzwoodland",
  "chr",
  "grandhighlander",
  "4runner",
  "toyotacrownsignia",
  "landcruiser",
  "sequoia",
  "corollahatchback",
  "prius",
  "priuspluginhybrid",
  "gr86",
  "grcorolla",
  "grsupra",
  "sienna",
  "toyotacrown",
  "mirai",
  "tacoma",
  "tundra",
];

function nonToyotaEntry(make, series, model, image) {
  return {
    make,
    series,
    model,
    year: 2024,
    grades: [
      {
        gradeName: "Hybrid",
        gradeSlug: "hybrid",
        angle: TARGET_ANGLE,
        defaultColorCode: "default",
        image,
        colors: [{ code: "default", title: "Default", image }],
      },
    ],
  };
}

const NON_TOYOTA_ENTRIES = [
  nonToyotaEntry(
    "Ford",
    "explorer",
    "Explorer Hybrid",
    "/images/search/ford-explorer-hybrid-2024.png"
  ),
  nonToyotaEntry(
    "Hyundai",
    "santafe",
    "Santa Fe Hybrid",
    "/images/search/hyundai-santa-fe-hybrid-2024.png"
  ),
  nonToyotaEntry(
    "Kia",
    "telluride",
    "Telluride Hybrid",
    "/images/search/kia-telluride-hybrid-2024.png"
  ),
];

const GET_SERIES_QUERY = `query GetSeries($brand: Brand!, $seriesId: String, $region: Region!, $year: Int) {
  getSeries(brand: $brand, seriesId: $seriesId, region: $region, year: $year) {
    seriesData {
      name
      yearSpecificData {
        year
        grades {
          gradeName
          trims { code isDefaultTrim }
        }
      }
    }
  }
}`;

const GET_CONFIG_BY_GRADE_QUERY = `query GetConfig($configInputGrade: ConfigInputGrade!) {
  getConfigByGrade(configInputGrade: $configInputGrade) {
    defaultConfig { exteriorColorId interiorColorId packageIds }
    exteriorColors { code title hexCode }
    configImages { exterior { ... on ToyotaImage { url angle } } }
  }
}`;

const GET_DEEP_LINK_QUERY = `query GetDeepLink($deepLinkConfigInput: DeepLinkConfigInput!) {
  getDeepLinkConfig(deepLinkConfigInput: $deepLinkConfigInput) {
    isDeepLinkValid
    config { configImages { exterior { ... on ToyotaImage { url angle } } } }
  }
}`;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const FORCE = args.has("--force");
const ALL = args.has("--all");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];

let SERIES_LIST;
if (ONLY) {
  SERIES_LIST = ONLY.split(",");
} else if (ALL) {
  SERIES_LIST = [...PRIMARY_SERIES, ...EXTENDED_SERIES];
} else {
  SERIES_LIST = PRIMARY_SERIES;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanColorTitle(title) {
  return title.replace(/\[[^\]]*\]/g, "").trim();
}

function withQuery(rawUrl, query) {
  const base = rawUrl.split("?")[0];
  return `${base}?${query}`;
}

function seriesAngle(seriesId) {
  return SERIES_ANGLE_OVERRIDE[seriesId] ?? TARGET_ANGLE;
}

function imageFileName(seriesId, gradeSlug, colorCode) {
  return `toyota-${seriesId}-${YEAR}-${gradeSlug}-${colorCode.toLowerCase()}-angle-${seriesAngle(seriesId)}.webp`;
}

function angleUrl(exterior, seriesId) {
  const angle = seriesAngle(seriesId);
  return (exterior ?? []).find((image) => image.angle === angle)?.url;
}

async function graphql(query, variables) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: REQUEST_HEADERS,
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    throw new Error(`GraphQL HTTP ${response.status}`);
  }
  const payload = await response.json();
  if (payload.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(payload.errors)}`);
  }
  return payload.data;
}

async function download(rawUrl, destPath) {
  if (!FORCE && existsSync(destPath)) {
    return "skipped";
  }
  if (DRY_RUN) {
    return "dry-run";
  }
  const response = await fetch(rawUrl, {
    headers: { "User-Agent": REQUEST_HEADERS["User-Agent"] },
  });
  if (!response.ok) {
    throw new Error(`image HTTP ${response.status} for ${rawUrl}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await mkdir(dirname(destPath), { recursive: true });
  await writeFile(destPath, buffer);
  return "downloaded";
}

async function fetchSeries(seriesId) {
  const data = await graphql(GET_SERIES_QUERY, {
    brand: "TOYOTA",
    seriesId,
    region: { zipCode: ZIP },
    year: YEAR,
  });
  const response = data.getSeries;
  if (!response?.seriesData?.length) {
    return null;
  }
  return response;
}

async function fetchGradeConfig(seriesId, gradeName) {
  const data = await graphql(GET_CONFIG_BY_GRADE_QUERY, {
    configInputGrade: {
      brand: "TOYOTA",
      region: { zipCode: ZIP },
      year: YEAR,
      seriesId,
      gradeName,
    },
  });
  return data.getConfigByGrade ?? null;
}

async function fetchColorImage(seriesId, modelCode, colorCode, interiorCode, packageCodes) {
  const data = await graphql(GET_DEEP_LINK_QUERY, {
    deepLinkConfigInput: {
      brand: "TOYOTA",
      year: YEAR,
      seriesId,
      trim: modelCode,
      exteriorColorCode: colorCode,
      interiorColorCode: interiorCode,
      packageCodes: packageCodes ?? [],
      region: { zipCode: ZIP },
    },
  });
  const result = data.getDeepLinkConfig;
  return {
    valid: Boolean(result?.isDeepLinkValid),
    url: angleUrl(result?.config?.configImages?.exterior, seriesId),
  };
}

function publicPath(...segments) {
  return `/vehicles/${segments.join("/")}`;
}

function destForPublicPath(imagePath) {
  return join(REPO_ROOT, "apps", "web", "public", imagePath.replace(LEADING_SLASH_RE, ""));
}

function modelCodeForGrade(grade) {
  const trims = grade.trims ?? [];
  const preferred = trims.find((trim) => trim.isDefaultTrim) ?? trims[0];
  return preferred?.code;
}

async function loadGradeConfig(seriesId, grade) {
  try {
    const config = await fetchGradeConfig(seriesId, grade.gradeName);
    if (!config) {
      console.warn(`    ! grade ${grade.gradeName}: no config`);
    }
    return config;
  } catch (error) {
    console.warn(`    ! grade ${grade.gradeName}: ${error.message}`);
    return null;
  }
}

async function resolveColorSource(ctx, color) {
  if (color.code === ctx.defaultColorCode) {
    return ctx.defaultUrl;
  }
  try {
    const resolved = await fetchColorImage(
      ctx.seriesId,
      ctx.modelCode,
      color.code,
      ctx.interiorCode,
      ctx.packageCodes
    );
    return resolved.valid && resolved.url ? resolved.url : ctx.defaultUrl;
  } catch {
    return ctx.defaultUrl;
  } finally {
    await sleep(60);
  }
}

async function downloadColorEntry(ctx, color, stats) {
  const source = await resolveColorSource(ctx, color);
  if (!source) {
    return null;
  }

  const fileName = imageFileName(ctx.seriesId, ctx.gradeSlug, color.code);
  const imagePath = publicPath("toyota", ctx.seriesId, String(YEAR), ctx.gradeSlug, fileName);
  try {
    const result = await download(withQuery(source, SCENE7_QUERY), destForPublicPath(imagePath));
    stats[result] = (stats[result] ?? 0) + 1;
    return {
      code: color.code,
      title: cleanColorTitle(color.title),
      hex: color.hexCode?.[0] ? `#${color.hexCode[0]}` : undefined,
      image: imagePath,
    };
  } catch (error) {
    console.warn(`    ! ${ctx.gradeName}/${color.code}: ${error.message}`);
    return null;
  }
}

async function processGrade(context, grade, stats) {
  const { seriesId } = context;
  const modelCode = modelCodeForGrade(grade);
  if (!modelCode) {
    console.warn(`    ! grade ${grade.gradeName}: no model code`);
    return null;
  }

  const config = await loadGradeConfig(seriesId, grade);
  if (!config) {
    return null;
  }

  const ctx = {
    seriesId,
    modelCode,
    gradeName: grade.gradeName,
    gradeSlug: slugify(grade.gradeName),
    defaultColorCode: config.defaultConfig?.exteriorColorId,
    interiorCode: config.defaultConfig?.interiorColorId,
    packageCodes: config.defaultConfig?.packageIds ?? [],
    defaultUrl: angleUrl(config.configImages?.exterior, seriesId),
  };

  const colorEntries = [];
  for (const color of config.exteriorColors ?? []) {
    const entry = await downloadColorEntry(ctx, color, stats);
    if (entry) {
      colorEntries.push(entry);
    }
  }

  if (colorEntries.length === 0) {
    return null;
  }

  const defaultEntry =
    colorEntries.find((entry) => entry.code === ctx.defaultColorCode) ?? colorEntries[0];

  return {
    gradeName: grade.gradeName,
    gradeSlug: ctx.gradeSlug,
    angle: seriesAngle(ctx.seriesId),
    defaultColorCode: defaultEntry.code,
    image: defaultEntry.image,
    colors: colorEntries,
  };
}

async function processSeries(seriesId, manifest, stats) {
  let series;
  try {
    series = await fetchSeries(seriesId);
  } catch (error) {
    console.warn(`  ! ${seriesId}: ${error.message}`);
    stats.failedSeries.push(seriesId);
    return;
  }
  if (!series) {
    console.warn(`  ! ${seriesId}: no data for ${YEAR}`);
    stats.failedSeries.push(seriesId);
    return;
  }

  const seriesEntry = series.seriesData[0];
  const displayName = seriesEntry.name;
  const yearData = seriesEntry.yearSpecificData.find((entry) => entry.year === YEAR);
  if (!yearData) {
    console.warn(`  ! ${seriesId}: year ${YEAR} not present`);
    stats.failedSeries.push(seriesId);
    return;
  }

  const grades = [];
  let colorTotal = 0;
  for (const grade of yearData.grades ?? []) {
    const entry = await processGrade({ seriesId }, grade, stats);
    if (entry) {
      grades.push(entry);
      colorTotal += entry.colors.length;
    }
    await sleep(80);
  }

  if (grades.length === 0) {
    console.warn(`  ! ${seriesId}: no grade images`);
    stats.failedSeries.push(seriesId);
    return;
  }

  manifest.push({ make: "Toyota", series: seriesId, model: displayName, year: YEAR, grades });
  console.log(
    `  ✓ ${seriesId} (${displayName}): ${grades.length} grades, ${colorTotal} color images`
  );
}

async function main() {
  console.log(
    `Fetching ${SERIES_LIST.length} series for ${YEAR} (angle ${TARGET_ANGLE}, per-color)${DRY_RUN ? " (dry-run)" : ""}${FORCE ? " (force)" : ""}`
  );
  const manifest = [];
  const stats = { downloaded: 0, skipped: 0, "dry-run": 0, failedSeries: [] };

  for (const seriesId of SERIES_LIST) {
    console.log(`- ${seriesId}`);
    await processSeries(seriesId, manifest, stats);
    await sleep(150);
  }

  manifest.push(...NON_TOYOTA_ENTRIES);

  manifest.sort((a, b) => `${a.make}${a.model}`.localeCompare(`${b.make}${b.model}`));

  if (!DRY_RUN) {
    await mkdir(dirname(MANIFEST_OUT), { recursive: true });
    const fileBody = [
      'import type { VehicleImageEntry } from "./types";',
      "",
      `const vehicleImageManifest: VehicleImageEntry[] = ${JSON.stringify(manifest, null, 2)};`,
      "",
      "export { vehicleImageManifest };",
      "",
    ].join("\n");
    await writeFile(MANIFEST_OUT, fileBody);
  }

  console.log("\nDone.");
  console.log(`  downloaded: ${stats.downloaded ?? 0}`);
  console.log(`  skipped:    ${stats.skipped ?? 0}`);
  if (DRY_RUN) {
    console.log(`  would-fetch: ${stats["dry-run"] ?? 0}`);
  }
  console.log(`  series in manifest: ${manifest.length}`);
  if (stats.failedSeries.length > 0) {
    console.log(`  failed series: ${stats.failedSeries.join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
