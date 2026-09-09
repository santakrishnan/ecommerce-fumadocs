import type { Category, Package } from "../types/categorized-modal";

export const FEATURES_FIXTURE: Category[] = [
  {
    id: "comfort",
    title: "Comfort",
    items: [
      { label: "Air conditioning" },
      { label: "Cabin air filter" },
      { label: "Entry air filter" },
      { label: "60-40 folding rear seats" },
      { label: "In-cabin display screen" },
      { label: "Rear seats with 3-way climate control" },
    ],
  },
  {
    id: "convenience",
    title: "Convenience",
    items: [
      { label: "Keyless entry" },
      { label: "Keyless start" },
      { label: "Remote door locks" },
      { label: "Rear view mirror with HomeLink Compass" },
      { label: "Rear window defroster" },
      { label: "Trip computer" },
      { label: "Day/Night auto mirror" },
      { label: "Power Tailgate" },
    ],
  },
  {
    id: "safety-security",
    title: "Safety & Security",
    items: [
      { label: "ABS brakes" },
      { label: "Antitheft alarm" },
      { label: "Electronic Stability Control" },
      { label: "Blind Spot Monitor with Rear Cross-Traffic Alert" },
      { label: "Pre-Collision System with Pedestrian Detection" },
      { label: "Lane Departure Alert with Steering Assist" },
      { label: "Adaptive Cruise Control" },
      { label: "Rear quarter windows" },
      { label: "Multi-point inspection" },
    ],
  },
  {
    id: "interior",
    title: "Interior Appointments",
    items: [
      { label: "Safety bumper" },
      { label: "LED daytime running lights" },
      { label: "Sunroof" },
      { label: "Roof rails" },
      { label: "Alloy wheels" },
      { label: "Body type" },
    ],
  },
  {
    id: "entertainment",
    title: "Entertainment",
    items: [
      { label: "Audio/Apple CarPlay/Android Auto sync" },
      { label: "Wireless charging" },
      { label: "Backup display" },
      { label: "USB options" },
    ],
  },
  {
    id: "technology",
    title: "Technology",
    items: [
      { label: "Apple CarPlay" },
      { label: "Navigation" },
      { label: "Ford Bluetooth" },
      { label: "Sound Sense recognition" },
    ],
  },
];

export const PACKAGES_FIXTURE: Package = {
  id: "package",
  title: "Package",
  items: [
    {
      packageName: "JBL Audio Package includes:",
      footnote: "* See toyota.com/audio-multimedia for details.",
      items: [
        {
          label:
            "12.3-in. Toyota Audio Multimedia with 11 JBL® speakers, including subwoofer & amplifier",
        },
        { label: "Wireless Apple CarPlay® & Android Auto™ compatibility" },
        { label: "USB media port" },
        { label: "Four USB charge ports" },
        { label: "Hands-free phone capability & music streaming via Bluetooth" },
        { label: "SiriusXM 3 month trial subscription" },
      ],
    },
    {
      packageName: "Limited Premium Package includes:",
      items: [
        { label: "Premium LED headlights" },
        { label: "Trailer Backup Guide with Straight Path Assist (SPA)" },
        { label: "Digital rearview mirror" },
      ],
    },
  ],
};
