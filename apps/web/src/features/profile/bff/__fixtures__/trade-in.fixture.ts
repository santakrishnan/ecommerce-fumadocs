import type { TradeInVehiclesResponse } from "../contracts/trade-in-response";

/** Single filled trade-in vehicle fixture. */
export const TRADE_IN_VEHICLES_FIXTURE: TradeInVehiclesResponse = [
  {
    id: "trade-in-001",
    year: 2025,
    title: "MAZDA CX-5 2.5 S AWD",
    licensePlate: "XYZ5678",
    state: "NY",
    imageUrl: "/images/trade-in/sedan.png",
    estimatedValue: 20_600,
  },
  {
    id: "trade-in-002",
    year: 1992,
    title: "TOYOTA PREVIA",
    licensePlate: "8XYZ123",
    state: "NY",
    imageUrl: "/images/trade-in/truck.png",
    estimatedValue: 7950,
  },
  {
    id: "trade-in-003",
    year: 2022,
    title: "TOYOTA COROLLA",
    licensePlate: "8XYZ942",
    state: "NY",
    imageUrl: "/images/trade-in/sedan.png",
    estimatedValue: 18_500,
  },
];

/** Empty fixture — renders the invitation state. */
export const TRADE_IN_VEHICLES_EMPTY_FIXTURE: TradeInVehiclesResponse = [];
