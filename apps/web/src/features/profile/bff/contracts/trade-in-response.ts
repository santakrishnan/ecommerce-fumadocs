/**
 * BFF response contract for trade-in vehicles.
 *
 * Defines the shape returned by `getTradeInVehicles` use-case and consumed
 * by the TradeInSection server component.
 */
export interface TradeInVehicle {
  /** Estimated trade-in value in dollars (whole number) */
  estimatedValue: number;
  id: string;
  /** URL or path to the vehicle image (e.g. "/trade-in/sedan.png" or an absolute URL) */
  imageUrl: string;
  /** License plate number, e.g. "XYZ5678" */
  licensePlate: string;
  /** Two-letter state code, e.g. "NY" */
  state: string;
  /** Display title, e.g. "MAZDA CX-5 2.5 S AWD" */
  title: string;
  year: number;
}

export type TradeInVehiclesResponse = TradeInVehicle[];
