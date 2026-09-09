import type { Category } from "../types/categorized-modal";

export const SPECS_FIXTURE: Category[] = [
  {
    id: "vehicle-details",
    title: "Vehicle details",
    items: [
      { label: "VIN", value: "ABC1906D49BT" },
      { label: "Stock number", value: "98761431T" },
      { label: "Number of Keys", value: "1" },
    ],
  },
  {
    id: "mechanical",
    title: "Mechanical",
    items: [
      { label: "Engine", value: "I-4" },
      { label: "Transmission", value: "8-Speed Automatic Transmission" },
      { label: "Drivetrain", value: "All-Wheel Drive w/ Multi-Terrain Select" },
      { label: "Fuel type", value: "Hybrid" },
    ],
  },
  {
    id: "performance",
    title: "Performance",
    items: [
      { label: "City / Hwy MPG", value: "36 / 31" },
      { label: "Horsepower", value: "265" },
    ],
  },
  {
    id: "measurements",
    title: "Measurements",
    items: [
      { label: "Seating capacity", value: "5 seats" },
      { label: "Seat headroom", value: "120 cm" },
      { label: "Front legroom", value: "43 in" },
      { label: "Front console", value: "84.3/1" },
      { label: "Shoulder distance", value: "3 in" },
      { label: "Overall length", value: "184.3 in" },
      { label: "Overall width", value: "75 in" },
      { label: "Overall height", value: "60.1 in" },
      { label: "Wheelbase", value: "114.2 in" },
    ],
  },
];
