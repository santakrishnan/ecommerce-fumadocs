/**
 * Filter options fixture data — matches Figma node 130:86983 (All Filters).
 * Use as mock data in tests and Storybook stories.
 */

export const BODY_TYPES = [
  "Sedan",
  "SUV",
  "Truck",
  "Coupe",
  "Hatchback",
  "Wagon",
  "Van",
  "Convertible",
] as const;

export type BodyType = (typeof BODY_TYPES)[number];

export const MODELS_BY_BODY_TYPE: Record<BodyType, string[]> = {
  Sedan: ["Camry", "Corolla", "Crown", "Mirai", "Prius", "Yaris", "Echo", "Tercel", "All Sedans"],
  SUV: [
    "Rav4",
    "Highlander",
    "Grand Highlander",
    "4Runner",
    "Sequoia",
    "Land Cruiser",
    "Corolla Cross",
    "Crown Signia",
    "C-HR",
    "bZ4X",
    "bZ",
    "Venza",
    "FJ Cruiser",
    "All SUVs",
  ],
  Truck: ["Tacoma", "Tundra", "All Trucks"],
  Coupe: ["GR86", "Supra", "Celica", "MR2", "All Coupes"],
  Hatchback: ["Corolla Hatchback", "GR Corolla", "Prius", "Yaris", "Matrix", "All Hatchbacks"],
  Wagon: ["Venza", "Camry Wagon", "All Wagons"],
  Van: ["Sienna", "Previa", "All Vans"],
  Convertible: ["Solara", "Celica", "MR2", "All Convertibles"],
};

export const EXTERIOR_COLORS = [
  { name: "Black", hex: "#1a1a1a" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Brown", hex: "#78350f" },
  { name: "Green", hex: "#166534" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Gray", hex: "#6b7280" },
  { name: "Red", hex: "#dc2626" },
  { name: "Silver", hex: "#d1d5db" },
  { name: "White", hex: "#ffffff" },
  { name: "Other", hex: null },
] as const;

export const INTERIOR_COLORS = [
  { name: "Beige", hex: "#d4a574" },
  { name: "Blue", hex: "#1e3a5f" },
  { name: "Brown", hex: "#5c3317" },
  { name: "Ivory", hex: "#fffff0" },
  { name: "Gray", hex: "#6b7280" },
  { name: "Red", hex: "#8b1a1a" },
  { name: "White", hex: "#ffffff" },
  { name: "Other", hex: null },
] as const;

export const FUEL_TYPES = [
  "Gas",
  "Diesel",
  "Hybrid",
  "Plug-in Hybrid (PHEV)",
  "Electric",
  "Flex Fuel",
] as const;

export const DRIVETRAINS = ["AWD", "FWD", "RWD", "4WD"] as const;

export const TRANSMISSIONS = ["Automatic", "CVT", "Manual"] as const;

export const FEATURE_CATEGORIES = [
  "Comfort",
  "Safety",
  "Tech",
  "Performance",
  "Exterior",
  "Seating Capacity",
] as const;

export type FeatureCategory = (typeof FEATURE_CATEGORIES)[number];

export const FEATURES_BY_CATEGORY: Record<FeatureCategory, string[]> = {
  Comfort: [
    "Leather",
    "SofTex",
    "Heated Fronts",
    "Ventilated",
    "Heated Rear",
    "Heated Wheel",
    "Power Liftgate",
    "Hands-Free",
    "Remote Start",
    "Keyless",
    "Push Start",
    "Dual Climate",
    "Tri-Zone",
    "Moonroof",
    "Panoramic",
    "Memory Seats",
  ],
  Safety: [
    "Pre-Collision",
    "Lane Departure",
    "Adaptive Cruise",
    "Blind Spot",
    "Rear Cross Traffic",
    "Parking Sensors",
    "360 Camera",
    "Road Sign Assist",
    "Night Vision",
  ],
  Tech: [
    "Apple CarPlay",
    "Android Auto",
    "Wireless Charging",
    "Head-Up Display",
    "JBL Audio",
    "Premium Audio",
    "Navigation",
    "Digital Rearview",
    "Connected Services",
  ],
  Performance: [
    "Sport Suspension",
    "Paddle Shifters",
    "Limited Slip",
    "Torsen Diff",
    "Adaptive Dampers",
    "Performance Exhaust",
  ],
  Exterior: [
    "LED Headlights",
    "Fog Lights",
    "Power Mirrors",
    "Heated Mirrors",
    "Roof Rails",
    "Running Boards",
    "Tow Package",
    "Chrome Delete",
  ],
  "Seating Capacity": ["4", "5", "7", "8"],
};

export const PRICE_QUICK_OPTIONS = [
  { label: "$10k or less", value: "10000" },
  { label: "$20k or less", value: "20000" },
  { label: "$30k or less", value: "30000" },
  { label: "$40k or less", value: "40000" },
  { label: "$50k or less", value: "50000" },
] as const;

export const YEAR_OPTIONS = [
  { label: "2025", value: "2025" },
  { label: "2024", value: "2024" },
  { label: "2023", value: "2023" },
  { label: "2022", value: "2022" },
  { label: "2021", value: "2021" },
  { label: "2020", value: "2020" },
  { label: "2019", value: "2019" },
  { label: "2018", value: "2018" },
  { label: "2017", value: "2017" },
  { label: "2016", value: "2016" },
  { label: "2015", value: "2015" },
  { label: "Newest", value: "newest" },
] as const;

export const YEAR_QUICK_OPTIONS = [
  { label: "2023 or newer", value: "2023+" },
  { label: "2022 or newer", value: "2022+" },
  { label: "2019–2021", value: "2019-2021" },
  { label: "2015–2018", value: "2015-2018" },
] as const;

export const MILEAGE_QUICK_OPTIONS = [
  { label: "Under 15k mi", value: "15000" },
  { label: "Under 30k mi", value: "30000" },
  { label: "Under 50k mi", value: "50000" },
  { label: "Under 75k mi", value: "75000" },
  { label: "Under 100k mi", value: "100000" },
] as const;

/**
 * Mock active filters state — matches the Figma screenshot (6 selected).
 */
export const MOCK_ACTIVE_FILTERS = {
  models: ["Highlander"],
  fuelTypes: ["Hybrid"],
  yearFrom: "2022",
  mileageMax: 50_000,
  drivetrains: ["AWD"],
  priceMax: 35_000,
} as const;

/**
 * Derived active filter pills for the header row.
 */
export const MOCK_ACTIVE_FILTER_PILLS = [
  { key: "models", value: "Highlander", label: "Highlander" },
  { key: "fuelTypes", value: "Hybrid", label: "Hybrid" },
  { key: "yearFrom", value: "2022+", label: "2022 or newer" },
  { key: "mileageMax", value: "50000", label: "Under 50K miles" },
  { key: "drivetrains", value: "AWD", label: "AWD" },
  { key: "priceMax", value: "35000", label: "$35K or less" },
  { key: "interiorColors", value: "Black", label: "Black Interior" },
  { key: "exteriorColors", value: "White", label: "White Exterior" },
] as const;
