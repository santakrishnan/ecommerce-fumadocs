/**
 * Mock data for filter sections.
 * Centralized in one file for easy swapping with real API data later.
 */

export interface FilterRangeField {
  label: string;
  value: string;
}

export interface FilterQuickPill {
  /** Hex color value for swatch circle (e.g. "#1a1a1a") — only for color-type pills */
  hex?: string;
  label: string;
  selected?: boolean;
  value: string;
}

export interface FilterColorGroup {
  colors: FilterQuickPill[];
  label: string;
}

export interface FilterModelTab {
  label: string;
  models: FilterQuickPill[];
  value: string;
}

export interface FilterRadioOption {
  description?: string;
  label: string;
  value: string;
}

export interface FilterSectionMockData {
  /** Color groups (Exterior / Interior) — used only for color section */
  colorGroups?: FilterColorGroup[];
  /** Feature category tabs (Comfort, Safety, Tech, etc.) — used only for features section */
  featureTabs?: FilterModelTab[];
  /** Model tabs (Sedan, SUV, Truck, etc.) — used only for model section */
  modelTabs?: FilterModelTab[];
  /** Quick filter pills below the range fields */
  quickFilters?: FilterQuickPill[];
  /** Radio options — used for inspection section */
  radioOptions?: FilterRadioOption[];
  /** Range inputs (Min/Max or From/To) — always shown as a pair */
  rangeFields?: [FilterRangeField, FilterRangeField];
  /** Whether range fields use a dropdown-style (chevron) or plain input */
  rangeType?: "input" | "select";
}

/** Mock data keyed by section key */
export const FILTER_MOCK_DATA: {
  model: FilterSectionMockData;
  color: FilterSectionMockData;
  drivetrain: FilterSectionMockData;
  features: FilterSectionMockData;
  "fuel-type": FilterSectionMockData;
  inspection: FilterSectionMockData;
  mileage: FilterSectionMockData;
  price: FilterSectionMockData;
  transmission: FilterSectionMockData;
  year: FilterSectionMockData;
} = {
  model: {
    modelTabs: [
      {
        label: "Sedan",
        models: [
          { label: "Camry", value: "camry" },
          { label: "Corolla", value: "corolla" },
          { label: "Avalon", value: "avalon" },
          { label: "Prius", value: "prius" },
          { label: "Sedan", value: "sedan" },
        ],
        value: "sedan",
      },
      {
        label: "SUV",
        models: [
          { label: "Highlander", value: "highlander" },
          { label: "Rav4", value: "rav4" },
          { label: "4Runner", value: "4runner" },
          { label: "Sequoia", value: "sequoia" },
          { label: "Venza", value: "venza" },
          { label: "C-HR", value: "c-hr" },
          { label: "SUV", value: "suv" },
        ],
        value: "suv",
      },
      {
        label: "Truck",
        models: [
          { label: "Tacoma", value: "tacoma" },
          { label: "Tundra", value: "tundra" },
          { label: "Truck", value: "truck" },
        ],
        value: "truck",
      },
      {
        label: "Coupe",
        models: [
          { label: "GR86", value: "gr86" },
          { label: "Supra", value: "supra" },
          { label: "Coupe", value: "coupe" },
        ],
        value: "coupe",
      },
      {
        label: "Hatchback",
        models: [
          { label: "Corolla HB", value: "corolla-hb" },
          { label: "Hatchback", value: "hatchback" },
        ],
        value: "hatchback",
      },
      {
        label: "Wagon",
        models: [{ label: "Wagon", value: "wagon" }],
        value: "wagon",
      },
      {
        label: "Van",
        models: [
          { label: "Sienna", value: "sienna" },
          { label: "Van", value: "van" },
        ],
        value: "van",
      },
      {
        label: "Convertible",
        models: [{ label: "Convertible", value: "convertible" }],
        value: "convertible",
      },
    ],
  },
  color: {
    colorGroups: [
      {
        colors: [
          { hex: "#1a1a1a", label: "Black", value: "ext-black" },
          { hex: "#3366cc", label: "Blue", value: "ext-blue" },
          { hex: "#8B4513", label: "Brown", value: "ext-brown" },
          { hex: "#2E8B57", label: "Green", value: "ext-green" },
          { hex: "#DAA520", label: "Yellow", value: "ext-yellow" },
          { hex: "#808080", label: "Gray", value: "ext-gray" },
          { hex: "#CC0000", label: "Red", value: "ext-red" },
          { hex: "#C0C0C0", label: "Silver", value: "ext-silver" },
          { hex: "#F5F5F5", label: "White", value: "ext-white" },
          { label: "Other", value: "ext-other" },
        ],
        label: "Exterior",
      },
      {
        colors: [
          { hex: "#C8AD7F", label: "Beige", value: "int-beige" },
          { hex: "#1a1a2e", label: "Blue", value: "int-blue-dark" },
          { hex: "#3366cc", label: "Blue", value: "int-blue" },
          { hex: "#8B4513", label: "Brown", value: "int-brown" },
          { hex: "#FFFDD0", label: "Ivory", value: "int-ivory" },
          { hex: "#808080", label: "Gray", value: "int-gray" },
          { hex: "#CC0000", label: "Red", value: "int-red" },
          { hex: "#F5F5F5", label: "White", value: "int-white" },
          { label: "Other", value: "int-other" },
        ],
        label: "Interior",
      },
    ],
  },
  drivetrain: {
    quickFilters: [
      { label: "AWD", value: "awd" },
      { label: "FWD", value: "fwd" },
      { label: "RWD", value: "rwd" },
      { label: "4WD", value: "4wd" },
    ],
  },
  features: {
    featureTabs: [
      {
        label: "Comfort",
        models: [
          { label: "Leather", value: "leather" },
          { label: "SofTex", value: "softex" },
          { label: "Heated Fronts", value: "heated-fronts" },
          { label: "Ventilated", value: "ventilated" },
          { label: "Heated Rear", value: "heated-rear" },
          { label: "Heated Wheel", value: "heated-wheel" },
          { label: "Power Liftgate", value: "power-liftgate" },
          { label: "Hands-Free", value: "hands-free" },
          { label: "Remote Start", value: "remote-start" },
          { label: "Keyless", value: "keyless" },
          { label: "Push Start", value: "push-start" },
          { label: "Dual Climate", value: "dual-climate" },
          { label: "Tri-Zone", value: "tri-zone" },
          { label: "Moonroof", value: "moonroof" },
          { label: "Panoramic", value: "panoramic" },
          { label: "Memory Seats", value: "memory-seats" },
        ],
        value: "comfort",
      },
      {
        label: "Safety",
        models: [
          { label: "Blind Spot", value: "blind-spot" },
          { label: "Lane Departure", value: "lane-departure" },
          { label: "Adaptive Cruise", value: "adaptive-cruise" },
          { label: "Pre-Collision", value: "pre-collision" },
          { label: "Backup Camera", value: "backup-camera" },
          { label: "Parking Sensors", value: "parking-sensors" },
        ],
        value: "safety",
      },
      {
        label: "Tech",
        models: [
          { label: "Navigation", value: "navigation" },
          { label: "Apple CarPlay", value: "apple-carplay" },
          { label: "Android Auto", value: "android-auto" },
          { label: "Wireless Charging", value: "wireless-charging" },
          { label: "Head-Up Display", value: "head-up-display" },
          { label: "Premium Audio", value: "premium-audio" },
        ],
        value: "tech",
      },
      {
        label: "Performance",
        models: [
          { label: "Turbo", value: "turbo" },
          { label: "Sport Suspension", value: "sport-suspension" },
          { label: "Paddle Shifters", value: "paddle-shifters" },
          { label: "Limited Slip", value: "limited-slip" },
        ],
        value: "performance",
      },
      {
        label: "Exterior",
        models: [
          { label: "LED Headlights", value: "led-headlights" },
          { label: "Fog Lights", value: "fog-lights" },
          { label: "Roof Rails", value: "roof-rails" },
          { label: "Running Boards", value: "running-boards" },
          { label: "Tow Package", value: "tow-package" },
        ],
        value: "exterior",
      },
      {
        label: "Seating Capacity",
        models: [
          { label: "5", value: "5" },
          { label: "7", value: "7" },
          { label: "8", value: "8" },
        ],
        value: "seating-capacity",
      },
    ],
  },
  "fuel-type": {
    quickFilters: [
      { label: "Gas", value: "gas" },
      { label: "Diesel", value: "diesel" },
      { label: "Hybrid", value: "hybrid" },
      { label: "Plug-in Hybrid (PHEV)", value: "phev" },
      { label: "Electric", value: "electric" },
      { label: "Flex Fuel", value: "flex-fuel" },
    ],
  },
  inspection: {
    radioOptions: [
      {
        description: "Factory-trained technician verified",
        label: "160-Point Inspection",
        value: "160-point",
      },
    ],
  },
  mileage: {
    quickFilters: [
      { label: "Under 15K mi", value: "15000" },
      { label: "Under 30K mi", value: "30000" },
      { label: "Under 50K mi", selected: true, value: "50000" },
      { label: "Under 75K mi", value: "75000" },
      { label: "Under 100K mi", value: "100000" },
    ],
    rangeFields: [
      { label: "Min", value: "0 mi" },
      { label: "Max", value: "50K miles" },
    ],
    rangeType: "input",
  },
  price: {
    quickFilters: [
      { label: "$10k or less", value: "10000" },
      { label: "$20k or less", value: "20000" },
      { label: "$30k or less", value: "30000" },
      { label: "$40k or less", value: "40000" },
      { label: "$50k or less", value: "50000" },
    ],
    rangeFields: [
      { label: "Min", value: "$0" },
      { label: "Max", value: "$35K" },
    ],
    rangeType: "input",
  },
  transmission: {
    quickFilters: [
      { label: "Automatic", value: "automatic" },
      { label: "CVT", value: "cvt" },
      { label: "Manual", value: "manual" },
    ],
  },
  year: {
    quickFilters: [
      { label: "2023 or newer", value: "2023" },
      { label: "2022 or newer", selected: true, value: "2022" },
      { label: "2019\u20132021", value: "2019-2021" },
      { label: "2015\u20132018", value: "2015-2018" },
    ],
    rangeFields: [
      { label: "From", value: "2022" },
      { label: "To", value: "Newest" },
    ],
    rangeType: "select",
  },
};
