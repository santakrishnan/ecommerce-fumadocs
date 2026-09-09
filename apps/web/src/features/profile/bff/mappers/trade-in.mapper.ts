import type { TradeInVehiclesResponse } from "../contracts/trade-in-response";

/**
 * Maps the upstream trade-in response to the BFF response shape.
 * Currently a pass-through — upstream and client schemas are aligned.
 */
export function mapTradeInUpstreamToResponse(
  upstream: TradeInVehiclesResponse
): TradeInVehiclesResponse {
  return upstream.map(({ id, year, title, licensePlate, state, imageUrl, estimatedValue }) => ({
    id,
    year,
    title,
    licensePlate,
    state,
    imageUrl,
    estimatedValue,
  }));
}
