import type { SearchAlias } from "../types/search-aliases";

/**
 * Comprehensive search alias fixture for VDP features and specs.
 *
 * Maps consumer-facing terminology to standardized feature/spec names.
 * Supports flexible matching: abbreviations, common names, variations, synonyms.
 *
 * @example
 * User types "ACC" → finds "Adaptive Cruise Control"
 * User types "backup cam" → finds "Rear View Camera"
 * User types "heated" → finds "Heated front seats", "Heated mirrors", etc.
 */
export const SEARCH_ALIASES_FIXTURE: SearchAlias[] = [
  // ─── Safety & Security ─────────────────────────────────────────────────

  {
    primaryName: "Adaptive Cruise Control",
    acceptedTerms: ["ACC", "Adaptive Cruise", "cruise control", "auto cruise"],
  },
  {
    primaryName: "Blind Spot Monitor with Rear Cross-Traffic Alert",
    acceptedTerms: ["BSM", "Blind Spot", "blind spot alert", "cross traffic", "rear alert"],
  },
  {
    primaryName: "Pre-Collision System with Pedestrian Detection",
    acceptedTerms: [
      "PCS",
      "Pre-collision",
      "collision warning",
      "pedestrian detection",
      "safety system",
    ],
  },
  {
    primaryName: "Lane Departure Alert with Steering Assist",
    acceptedTerms: ["Lane departure", "lane alert", "lane warning", "steering assist", "LDA"],
  },
  {
    primaryName: "ABS brakes",
    acceptedTerms: ["ABS", "anti-lock brakes", "anti-lock braking", "braking system"],
  },
  {
    primaryName: "Electronic Stability Control",
    acceptedTerms: ["ESC", "stability control", "traction control", "electronic stability"],
  },

  // ─── Comfort ──────────────────────────────────────────────────────────

  {
    primaryName: "Leather steering wheel",
    acceptedTerms: ["leather wheel", "steering wheel", "leather grip"],
  },
  {
    primaryName: "Heated front seats",
    acceptedTerms: ["heated seats", "seat heater", "warming seats", "heated"],
  },
  {
    primaryName: "Dual-zone automatic climate control",
    acceptedTerms: [
      "climate control",
      "dual zone",
      "dual-zone",
      "air conditioning",
      "AC",
      "temperature control",
    ],
  },
  {
    primaryName: "Power liftgate",
    acceptedTerms: ["power gate", "liftgate", "power trunk", "auto gate", "electric gate"],
  },
  {
    primaryName: "60-40 folding rear seats",
    acceptedTerms: ["fold seats", "rear seats", "folding", "split seats", "cargo"],
  },
  {
    primaryName: "Air conditioning",
    acceptedTerms: ["AC", "cooling", "climate control", "air-con"],
  },
  {
    primaryName: "Cabin air filter",
    acceptedTerms: ["air filter", "cabin filter", "pollen filter"],
  },

  // ─── Technology & Entertainment ──────────────────────────────────────

  {
    primaryName: "12.3-inch touchscreen display",
    acceptedTerms: ["touchscreen", "display", "infotainment", "screen", "dashboard display"],
  },
  {
    primaryName: "Apple CarPlay & Android Auto",
    acceptedTerms: [
      "CarPlay",
      "Android Auto",
      "smartphone integration",
      "phone integration",
      "wireless",
      "Apple",
      "Android",
    ],
  },
  {
    primaryName: "Wireless charging pad",
    acceptedTerms: ["wireless charging", "charging pad", "phone charger", "Qi charging"],
  },
  {
    primaryName: "JBL Premium Audio – 11 speakers",
    acceptedTerms: ["JBL", "premium audio", "speakers", "sound system", "audio system"],
  },

  // ─── Exterior & Appearance ────────────────────────────────────────────

  {
    primaryName: "LED headlights with auto high beams",
    acceptedTerms: ["LED headlights", "headlights", "auto high beam", "high beam", "LED"],
  },
  {
    primaryName: "Power-folding heated mirrors",
    acceptedTerms: [
      "heated mirrors",
      "folding mirrors",
      "power mirrors",
      "auto-fold mirrors",
      "mirror heater",
    ],
  },
  {
    primaryName: "Roof rails",
    acceptedTerms: ["roof rack", "rails", "roof bars", "cargo rack"],
  },
  {
    primaryName: "19-inch alloy wheels",
    acceptedTerms: ["alloy wheels", "wheels", "rims", "19-inch"],
  },
  {
    primaryName: "LED daytime running lights",
    acceptedTerms: ["LED DRL", "daytime running lights", "DRL", "running lights"],
  },
  {
    primaryName: "Alloy wheels",
    acceptedTerms: ["alloy", "rims", "wheels", "mag wheels"],
  },
  {
    primaryName: "Body type",
    acceptedTerms: ["sedan", "SUV", "coupe", "hatchback", "body style"],
  },

  // ─── Convenience ──────────────────────────────────────────────────────

  {
    primaryName: "Cruise control",
    acceptedTerms: ["cruise", "speed control", "constant speed"],
  },
  {
    primaryName: "Keyless entry",
    acceptedTerms: ["keyless", "smart entry", "push button", "remote unlock"],
  },
  {
    primaryName: "Remote start",
    acceptedTerms: ["remote start", "remote ignition", "keyless start", "start button"],
  },
  {
    primaryName: "Power door locks",
    acceptedTerms: ["power locks", "auto lock", "electric locks"],
  },
  {
    primaryName: "Rear window defroster",
    acceptedTerms: ["defroster", "rear defroster", "rear window defog", "defog"],
  },
  {
    primaryName: "Trip computer",
    acceptedTerms: ["trip", "computer", "odometer", "fuel economy"],
  },
  {
    primaryName: "Power Tailgate",
    acceptedTerms: ["power gate", "tailgate", "power trunk", "automated gate"],
  },

  // ─── Performance & Mechanical ──────────────────────────────────────────

  {
    primaryName: "Engine",
    acceptedTerms: ["motor", "displacement", "engine type", "I-4", "V6", "V8"],
  },
  {
    primaryName: "Transmission",
    acceptedTerms: ["gearbox", "auto transmission", "automatic", "manual", "CVT"],
  },
  {
    primaryName: "Drivetrain",
    acceptedTerms: ["AWD", "FWD", "RWD", "all-wheel drive", "front-wheel drive", "rear-wheel"],
  },
  {
    primaryName: "Fuel type",
    acceptedTerms: ["hybrid", "electric", "gas", "gasoline", "diesel", "fuel"],
  },
  {
    primaryName: "Horsepower",
    acceptedTerms: ["HP", "power", "performance", "bhp"],
  },
  {
    primaryName: "City / Hwy MPG",
    acceptedTerms: ["mpg", "fuel economy", "mileage", "efficiency", "gas mileage"],
  },

  // ─── Measurements & Capacity ──────────────────────────────────────────

  {
    primaryName: "Seating capacity",
    acceptedTerms: ["seats", "seating", "passengers", "occupants"],
  },
  {
    primaryName: "Cargo volume",
    acceptedTerms: ["trunk space", "cargo", "storage", "trunk", "boot"],
  },
  {
    primaryName: "Wheelbase",
    acceptedTerms: ["wheel base", "distance", "measurements"],
  },
  {
    primaryName: "Overall length",
    acceptedTerms: ["length", "size", "dimensions"],
  },
  {
    primaryName: "Curb weight",
    acceptedTerms: ["weight", "mass", "lbs"],
  },

  // ─── Vehicle Details ──────────────────────────────────────────────────

  {
    primaryName: "VIN",
    acceptedTerms: ["vehicle identification number", "VIN number", "identification"],
  },
  {
    primaryName: "Stock number",
    acceptedTerms: ["stock", "inventory number", "SKU"],
  },
  {
    primaryName: "Number of Keys",
    acceptedTerms: ["keys", "spare keys", "key fobs"],
  },
];
