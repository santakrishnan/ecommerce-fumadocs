import { IMAGE_BASE_URL } from "@config/images";
import type {
  VehicleDetail,
  VehicleFeatures,
  VehicleLookupResponse,
  VehicleMedia,
  VehicleWarranty,
} from "@ucmp/sdk-search-api";
import type { VdpFaq } from "../bff/contracts/vdp-response.schema";
import type { VehicleInfoExtended } from "../bff/contracts/vehicle-info-extended";

type VehicleDetailFixture = Omit<
  VehicleDetail,
  | "description"
  | "features"
  | "media"
  | "packages"
  | "stockNumber"
  | "updatedAt"
  | "vehicleId"
  | "vehicleInfo"
  | "warranty"
> & {
  description: string;
  features: VehicleFeatures;
  media: NonNullable<VehicleMedia>;
  packages: NonNullable<VehicleDetail["packages"]>;
  soldAt?: string;
  stockNumber: string;
  updatedAt: string;
  vehicleId: number;
  vehicleInfo: VehicleInfoExtended;
  warranty: NonNullable<VehicleDetail["warranty"]>;
};

/**
 * VDP vehicle fixtures in the **exact upstream response shape**
 * (`docs/reference/vdp-vehicle-response.sample.json`), so this fixture is
 * reusable by other teams / contract tests. Images use **local paths** (agreed)
 * instead of remote CDN URLs.
 *
 * VINs reuse data already in the app so the card ↔ VDP connect:
 *  - `3TMDZ5BN8NM126690` — Highlander from New Today (`new-today.fixtures` VDPLink)
 *  - `2T1BURHE8JC039175` — RAV4 Hybrid from the client's response sample
 * The rest are valid 17-char ISO-3779 VINs for the remaining demo states,
 * including the no-photos fallback scenario.
 */

export const VDP_VINS = {
  highlanderDefault: "3TMDZ5BN8NM126690",
  rav4Estimate: "2T1BURHE8JC039175",
  highlanderOffer: "5TDKZRFH8NS112233",
  highlanderExpired: "4T1G11AK5NU445566",
  highlanderSold: "JTMRWRFV8ND778899",
  /** No dealer photos — triggers the color swatch fallback in the VDP. */
  highlanderNoPhotos: "5TDBZRFH7NS000001",
  /** 4Runner TRD Off Road — used as the default dealer deal card vehicle. */
  fourRunnerDealerDeal: "JTERU5JR7N6123456",
  // ─── Upstream VINs (fetched from real API, no origination yet) ─────────────
  upstreamCamry1: "4T1DAACK2SU601290",
  upstreamCamry2: "5TFLA5DB5SX278020",
  upstreamRav4: "2T3C1RFV7PW292947",
  upstreamCamry3: "4T1DAACK9SU571964",
  upstreamSequoia: "5TDDRKEC5NS135839",
} as const;

const BASE_FEATURES: VehicleFeatures = {
  ids: [
    "safety.tss_3_0",
    "safety.blind_spot_monitor",
    "seat.heated.front",
    "comfort.air_conditioning",
    "comfort.cabin_air_filter",
    "convenience.keyless_entry",
    "convenience.keyless_start",
    "convenience.power_tailgate",
    "entertainment.apple_carplay",
    "entertainment.android_auto",
    "technology.navigation",
  ],
  text: "Toyota Safety Sense 3.0, Blind Spot Monitor, Heated Front Seats, Air Conditioning, Keyless Entry, Apple CarPlay, Android Auto, Navigation",
  byCategory: [
    {
      category: "SAFETY",
      label: "Safety & Security",
      items: [
        { id: "safety.tss_3_0", name: "Toyota Safety Sense 3.0" },
        {
          id: "safety.blind_spot_monitor",
          name: "Blind Spot Monitor with Rear Cross-Traffic Alert",
        },
        { id: "safety.pre_collision", name: "Pre-Collision System with Pedestrian Detection" },
        { id: "safety.lane_departure", name: "Lane Departure Alert with Steering Assist" },
        { id: "safety.adaptive_cruise", name: "Adaptive Cruise Control" },
        { id: "safety.electronic_stability", name: "Electronic Stability Control" },
      ],
    },
    {
      category: "COMFORT",
      label: "Comfort",
      items: [
        { id: "comfort.air_conditioning", name: "Air Conditioning" },
        { id: "comfort.cabin_air_filter", name: "Cabin Air Filter" },
        { id: "seat.heated.front", name: "Heated Front Seats" },
        { id: "comfort.60_40_folding", name: "60-40 Folding Rear Seats" },
        { id: "comfort.tri_zone_climate", name: "Tri-Zone Automatic Climate Control" },
      ],
    },
    {
      category: "CONVENIENCE",
      label: "Convenience",
      items: [
        { id: "convenience.keyless_entry", name: "Keyless Entry" },
        { id: "convenience.keyless_start", name: "Keyless Start" },
        { id: "convenience.power_tailgate", name: "Power Tailgate" },
        { id: "convenience.remote_door_locks", name: "Remote Door Locks" },
        { id: "convenience.rear_window_defroster", name: "Rear Window Defroster" },
        { id: "convenience.trip_computer", name: "Trip Computer" },
      ],
    },
    {
      category: "ENTERTAINMENT",
      label: "Entertainment",
      items: [
        { id: "entertainment.apple_carplay", name: "Apple CarPlay" },
        { id: "entertainment.android_auto", name: "Android Auto" },
        { id: "entertainment.wireless_charging", name: "Wireless Charging" },
        { id: "entertainment.jbl_audio", name: "JBL Premium Audio System" },
      ],
    },
    {
      category: "TECHNOLOGY",
      label: "Technology",
      items: [
        { id: "technology.navigation", name: "Navigation" },
        { id: "technology.bluetooth", name: "Bluetooth Connectivity" },
        { id: "technology.head_up_display", name: "Head-Up Display" },
      ],
    },
  ],
};

const BASE_WARRANTY: VehicleWarranty = {
  basic: "3 years / 36,000 miles",
  powertrain: "5 years / 60,000 miles",
  hybrid: "8 years / 100,000 miles",
  corrosion: "5 years / unlimited miles",
  roadside: "2 years / 25,000 miles",
};

// ─── FAQ ─────────────────────────────────────────────────────────────────────
// Questions are inlined here (not imported from `vdp-search-faq.fixture.ts`)
// because that file imports from this one — importing back would create a
// circular dependency. The canonical answer content lives in
// `vdp-search-faq.fixture.ts`; these are just the pill labels shown in the UI.
// When a real upstream FAQ service arrives, swap this for a per-VIN lookup.
const FAQ_QUESTIONS = [
  "How comfortable is the 3rd row seating?",
  "What is the cargo space like?",
  "How does Limited compare to XLE?",
  "What makes this one better than the others I'm seeing?",
];

/**
 * Get FAQ pills for a given VIN.
 * Currently returns the same static pills for every VIN (matching Figma).
 * The heading is overridden dynamically in the page, so it's a generic fallback.
 */
export function getFaqForVin(_vin: string): VdpFaq {
  return {
    id: "faq-default",
    heading: "Questions about this vehicle?",
    questions: FAQ_QUESTIONS.map((q, i) => ({
      id: `q-${i}`,
      question: q,
    })),
  };
}

/** A Highlander Hybrid Limited (active) — matches the handoff card copy. */
function makeHighlander(
  overrides: Partial<VehicleDetailFixture> & { vin: string }
): VehicleDetailFixture {
  const vehicleInfo: VehicleInfoExtended = {
    year: 2023,
    make: "Toyota",
    model: "Highlander",
    modelCode: "6953",
    trim: "Hybrid Limited",
    style: "Limited 4dr SUV AWD",
    engine: "2.5L I-4 Hybrid",
    cityMpg: 35,
    hwyMpg: 35,
    doorCount: "4",
    bodyStyle: "SUV",
    bodyType: "Sports Utility Vehicle",
    drivetrain: "All Wheel Drive",
    fuelType: "Hybrid",
    transmission: "ECVT",
    transmissionType: "Automatic",
    transmissionSpeeds: 1,
    exteriorColor: "#CE1E2D",
    exteriorColorFamily: "Ruby Red Flare Pearl",
    interiorColor: "Glazed Caramel",
    interiorColorFamily: "Brown",
    interiorMaterial: "Leather",
    interiorTextureImage: `${IMAGE_BASE_URL}/images/vdp/Ellipse.png`,
    isNew: false,
    isActive: true,
    location: { latitude: 40.6386, longitude: -74.0259, zipCode: "11220" },
  };

  return {
    vehicleInfo,
    pricing: { listPrice: 31_775, msrp: 33_000, sellingPrice: 30_775, invoicePrice: 29_500 },
    status: {
      mileage: 36_435,
      vehicleStatus: "In Stock",
      daysInStock: 12,
      isCertified: true,
      isSpecial: false,
      inStockDate: "2026-06-11T12:00:00.000Z",
    },
    dealerInfo: {
      dealerCode: "BR-001",
      dealerName: "Toyota of Bay Ridge",
      city: "Brooklyn",
      state: "NY",
      zipCode: "11220",
      latitude: 40.6386,
      longitude: -74.0259,
    },
    vehicleId: 174_021_857,
    stockNumber: "STK-12669",
    features: structuredClone(BASE_FEATURES),
    packages: [
      {
        name: "JBL Audio Package",
        code: "JBL",
        description:
          "12.3-in. Toyota Audio Multimedia with 11 JBL speakers, including subwoofer & amplifier, Wireless Apple CarPlay & Android Auto compatibility",
        msrp: 1200,
        includedFeatures: [
          "entertainment.jbl_audio",
          "entertainment.apple_carplay",
          "entertainment.android_auto",
        ],
      },
    ],
    media: {
      photos: [
        // 6 photos with classification "VehicleExterior" → exterior section
        {
          url: `${IMAGE_BASE_URL}/images/vdp/vdp-hero.png`,
          displayOrder: 1,
          sourceId: "local",
          capturedAt: "2026-06-11T12:00:00.000Z",
          classification: "VehicleExterior",
        },
        {
          url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-exterior-2.png`,
          displayOrder: 2,
          sourceId: "local",
          capturedAt: "2026-06-11T12:00:00.000Z",
          classification: "VehicleExterior",
        },
        {
          url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-exterior-3.png`,
          displayOrder: 3,
          sourceId: "local",
          capturedAt: "2026-06-11T12:00:00.000Z",
          classification: "VehicleExterior",
        },
        {
          url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-exterior-4.png`,
          displayOrder: 4,
          sourceId: "local",
          capturedAt: "2026-06-11T12:00:00.000Z",
          classification: "VehicleExterior",
        },
        {
          url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-exterior-5.png`,
          displayOrder: 5,
          sourceId: "local",
          capturedAt: "2026-06-11T12:00:00.000Z",
          classification: "VehicleExterior",
        },
        {
          url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-exterior-6.png`,
          displayOrder: 6,
          sourceId: "local",
          capturedAt: "2026-06-11T12:00:00.000Z",
          classification: "VehicleExterior",
        },
        // 6 photos with classification "VehicleInterior" → interior section
        {
          url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-interior-1.png`,
          displayOrder: 7,
          sourceId: "local",
          capturedAt: "2026-06-11T12:00:00.000Z",
          classification: "VehicleInterior",
        },
        {
          url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-interior-2.png`,
          displayOrder: 8,
          sourceId: "local",
          capturedAt: "2026-06-11T12:00:00.000Z",
          classification: "VehicleInterior",
        },
        {
          url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-interior-3.png`,
          displayOrder: 9,
          sourceId: "local",
          capturedAt: "2026-06-11T12:00:00.000Z",
          classification: "VehicleInterior",
        },
        {
          url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-interior-4.png`,
          displayOrder: 10,
          sourceId: "local",
          capturedAt: "2026-06-11T12:00:00.000Z",
          classification: "VehicleInterior",
        },
        {
          url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-interior-5.png`,
          displayOrder: 11,
          sourceId: "local",
          capturedAt: "2026-06-11T12:00:00.000Z",
          classification: "VehicleInterior",
        },
        {
          url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-interior-6.png`,
          displayOrder: 12,
          sourceId: "local",
          capturedAt: "2026-06-11T12:00:00.000Z",
          classification: "VehicleInterior",
        },
      ],
      videos: [],
    },
    warranty: structuredClone(BASE_WARRANTY),
    description:
      "It has everything you're looking for, including plenty of space inside, while still compact enough to be perfect for getting around Brooklyn.",
    updatedAt: "2026-06-23T12:00:00.000Z",
    ...overrides,
  };
}

/** RAV4 Hybrid XSE (active) — from the client's response sample. */
const rav4VehicleInfo: VehicleInfoExtended = {
  year: 2024,
  make: "Toyota",
  model: "RAV4",
  modelCode: "4432",
  trim: "Hybrid XSE",
  style: "XSE 4dr SUV AWD",
  engine: "2.5L I-4 Hybrid",
  cityMpg: 41,
  hwyMpg: 38,
  doorCount: "4",
  bodyStyle: "SUV",
  bodyType: "Sports Utility Vehicle",
  drivetrain: "All Wheel Drive",
  fuelType: "Hybrid",
  transmission: "ECVT",
  transmissionType: "Automatic",
  transmissionSpeeds: 1,
  exteriorColor: "Wind Chill Pearl",
  exteriorColorFamily: "White",
  interiorColor: "Black SofTex",
  interiorColorFamily: "Black",
  interiorMaterial: "Synthetic Leather",
  interiorTextureImage: `${IMAGE_BASE_URL}/images/vdp/Ellipse.png`,
  isNew: false,
  isActive: true,
  location: { latitude: 39.8762, longitude: -75.5302, zipCode: "19342" },
};

const RAV4: VehicleDetailFixture = {
  vin: VDP_VINS.rav4Estimate,
  vehicleInfo: rav4VehicleInfo,
  pricing: { listPrice: 33_575, msrp: 35_075, sellingPrice: 32_075, invoicePrice: 31_200 },
  status: {
    mileage: 39_250,
    vehicleStatus: "In Stock",
    daysInStock: 10,
    isCertified: false,
    isSpecial: false,
    inStockDate: "2026-06-13T12:00:00.000Z",
  },
  dealerInfo: {
    dealerCode: "37148",
    dealerName: "Team Toyota of Glen Mills",
    city: "Concordville",
    state: "PA",
    zipCode: "19342",
    latitude: 39.8762,
    longitude: -75.5302,
  },
  vehicleId: 82_860_003,
  stockNumber: "STK-78432",
  features: structuredClone(BASE_FEATURES),
  packages: [
    {
      name: "XLE Weather Package",
      code: "CY",
      description: "Heated Steering Wheel, Heated Front Seats",
      msrp: 500,
      includedFeatures: ["comfort.heated_steering_wheel", "seat.heated.front"],
    },
  ],
  media: {
    photos: [
      // 6 photos with classification "VehicleExterior" → exterior section
      {
        url: `${IMAGE_BASE_URL}/images/vdp/vdp-hero.png`,
        displayOrder: 1,
        sourceId: "local",
        capturedAt: "2026-06-13T12:00:00.000Z",
        classification: "VehicleExterior",
      },
      {
        url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-exterior-2.png`,
        displayOrder: 2,
        sourceId: "local",
        capturedAt: "2026-06-13T12:00:00.000Z",
        classification: "VehicleExterior",
      },
      {
        url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-exterior-3.png`,
        displayOrder: 3,
        sourceId: "local",
        capturedAt: "2026-06-13T12:00:00.000Z",
        classification: "VehicleExterior",
      },
      {
        url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-exterior-4.png`,
        displayOrder: 4,
        sourceId: "local",
        capturedAt: "2026-06-13T12:00:00.000Z",
        classification: "VehicleExterior",
      },
      {
        url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-exterior-5.png`,
        displayOrder: 5,
        sourceId: "local",
        capturedAt: "2026-06-13T12:00:00.000Z",
        classification: "VehicleExterior",
      },
      {
        url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-exterior-6.png`,
        displayOrder: 6,
        sourceId: "local",
        capturedAt: "2026-06-13T12:00:00.000Z",
        classification: "VehicleExterior",
      },
      // 4 photos with classification "VehicleInterior" → interior section
      {
        url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-interior-1.png`,
        displayOrder: 7,
        sourceId: "local",
        capturedAt: "2026-06-13T12:00:00.000Z",
        classification: "VehicleInterior",
      },
      {
        url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-interior-2.png`,
        displayOrder: 8,
        sourceId: "local",
        capturedAt: "2026-06-13T12:00:00.000Z",
        classification: "VehicleInterior",
      },
      {
        url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-interior-3.png`,
        displayOrder: 9,
        sourceId: "local",
        capturedAt: "2026-06-13T12:00:00.000Z",
        classification: "VehicleInterior",
      },
      {
        url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-interior-4.png`,
        displayOrder: 10,
        sourceId: "local",
        capturedAt: "2026-06-13T12:00:00.000Z",
        classification: "VehicleInterior",
      },
      // 2 photos with classification "Detail" → detail section
      {
        url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-exterior-1.png`,
        displayOrder: 11,
        sourceId: "local",
        capturedAt: "2026-06-13T12:00:00.000Z",
        classification: "Detail",
      },
      {
        url: `${IMAGE_BASE_URL}/images/vdp/gallery/vdp-exterior-2.png`,
        displayOrder: 12,
        sourceId: "local",
        capturedAt: "2026-06-13T12:00:00.000Z",
        classification: "Detail",
      },
    ],
    videos: [],
  },
  warranty: structuredClone(BASE_WARRANTY),
  description:
    "This Toyota RAV4 Hybrid XSE offers a great combination of reliability and value for its price point. It features all-wheel drive, heated seats, and Apple CarPlay.",
  updatedAt: "2026-06-23T12:00:00.000Z",
};

/** 4Runner TRD Off Road — default dealer deal card vehicle on the Welcome Back page. */
const FOUR_RUNNER: VehicleDetailFixture = {
  vin: VDP_VINS.fourRunnerDealerDeal,
  vehicleId: 82_860_001,
  stockNumber: "STK-78001",
  vehicleInfo: {
    year: 2023,
    make: "Toyota",
    model: "4Runner",
    trim: "TRD Off Road",
    bodyStyle: "SUV",
    drivetrain: "Four Wheel Drive",
    fuelType: "Gasoline",
    engine: "4.0L V6",
    exteriorColor: "Lunar Rock",
    exteriorColorFamily: "Gray",
    isNew: false,
    isActive: true,
  },
  dealerInfo: {
    dealerCode: "5012",
    dealerName: "Bay Area Toyota",
    city: "San Francisco",
    state: "CA",
    zipCode: "94105",
    latitude: 37.7749,
    longitude: -122.4194,
  },
  pricing: {
    listPrice: 29_900,
    msrp: 36_900,
    sellingPrice: 29_900,
    invoicePrice: 28_500,
  },
  status: {
    mileage: 36_435,
    vehicleStatus: "In Stock",
    daysInStock: 5,
    isCertified: false,
    isSpecial: false,
    inStockDate: "2026-06-01T12:00:00.000Z",
  },
  features: structuredClone(BASE_FEATURES),
  packages: [],
  media: {
    photos: [
      {
        url: "/images/deal/four-runner-img.png",
        displayOrder: 1,
        sourceId: "local",
        capturedAt: "2026-06-01T12:00:00.000Z",
      },
      {
        url: "/images/deal/four-runner-img.png",
        displayOrder: 2,
        sourceId: "local",
        capturedAt: "2026-06-01T12:00:00.000Z",
      },
    ],
    videos: [],
  },
  warranty: structuredClone(BASE_WARRANTY),
  description: "Toyota 4Runner TRD Off Road",
  updatedAt: "2026-06-23T12:00:00.000Z",
};

/** Sold Highlander — `vehicleStatus: "Sold"`, inactive, with a proposed `soldAt`. */
const HIGHLANDER_SOLD: VehicleDetailFixture = {
  ...makeHighlander({ vin: VDP_VINS.highlanderSold }),
  vehicleId: 174_021_999,
  stockNumber: "STK-12699",
  vehicleInfo: { ...makeHighlander({ vin: VDP_VINS.highlanderSold }).vehicleInfo, isActive: false },
  media: {
    photos: [
      {
        url: `${IMAGE_BASE_URL}/images/vdp/sold-hero.png`,
        displayOrder: 1,
        sourceId: "local",
        capturedAt: "2026-06-11T12:00:00.000Z",
        classification: "VehicleExterior",
      },
    ],
    videos: [],
  },
  status: {
    ...makeHighlander({ vin: VDP_VINS.highlanderSold }).status,
    vehicleStatus: "Sold",
  },
  soldAt: "2026-03-24T00:00:00.000Z",
};

/** All demo vehicles, keyed by VIN. */
export const VDP_VEHICLES_BY_VIN: Record<string, VehicleDetailFixture> = {
  [VDP_VINS.highlanderDefault]: makeHighlander({ vin: VDP_VINS.highlanderDefault }),
  /** Car-Cutter test VIN — has real 360° data on the CDN. Used for v360-poc dev testing. */
  "4T1G11AK4PU151097": makeHighlander({
    vin: "4T1G11AK4PU151097",
    vehicleId: 174_022_002,
    stockNumber: "STK-360V1",
  }),
  [VDP_VINS.rav4Estimate]: RAV4,
  [VDP_VINS.highlanderOffer]: makeHighlander({
    vin: VDP_VINS.highlanderOffer,
    vehicleId: 174_021_858,
    stockNumber: "STK-11223",
  }),
  [VDP_VINS.highlanderExpired]: makeHighlander({
    vin: VDP_VINS.highlanderExpired,
    vehicleId: 174_021_859,
    stockNumber: "STK-44556",
  }),
  [VDP_VINS.highlanderSold]: HIGHLANDER_SOLD,
  /** 4Runner TRD Off Road — default dealer deal card vehicle. */
  [VDP_VINS.fourRunnerDealerDeal]: FOUR_RUNNER,
  /**
   * No-photos scenario — dealer has not uploaded any gallery images.
   * The VDP falls back to color swatch cards using vehicleInfo color fields.
   */
  [VDP_VINS.highlanderNoPhotos]: makeHighlander({
    vin: VDP_VINS.highlanderNoPhotos,
    vehicleId: 174_022_001,
    stockNumber: "STK-00001",
    vehicleInfo: {
      ...makeHighlander({ vin: VDP_VINS.highlanderNoPhotos }).vehicleInfo,
      // API now returns hex directly in exteriorColor / interiorColor
      exteriorColor: "#CE1E2D",
      exteriorColorFamily: "Ruby Red Flare Pearl",
      interiorColor: "#5c3317",
      interiorColorFamily: "Brown",
      interiorTextureImage: `${IMAGE_BASE_URL}/images/vdp/Ellipse.png`,
    },
    media: { photos: [], videos: [] },
  }),
};

/** Wrap selected vehicles in the upstream envelope (unknown VINs → `notFound`). */
export function vdpVehicleResponse(vins: string[]): VehicleLookupResponse {
  const vehicles: VehicleDetailFixture[] = [];
  const notFound: string[] = [];
  for (const vin of vins) {
    const vehicle = VDP_VEHICLES_BY_VIN[vin.toUpperCase()];
    if (vehicle) {
      vehicles.push(vehicle);
    } else {
      notFound.push(vin);
    }
  }
  return {
    data: { vehicles, notFound },
    meta: { traceId: "fixture-trace", timestamp: "2026-06-23T12:00:00.000Z" },
  };
}

/** Full sample envelope containing every demo vehicle. */
export const VDP_VEHICLE_RESPONSE: VehicleLookupResponse = vdpVehicleResponse(
  Object.values(VDP_VINS)
);
