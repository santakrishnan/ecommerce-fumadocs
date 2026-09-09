import "server-only";

import { TRADE_IN_VEHICLES_FIXTURE } from "../__fixtures__/trade-in.fixture";
import type { TradeInVehicle } from "../contracts/trade-in-response";

/**
 * Simulates a valuation call — longer delay than typical mocks since it
 * represents an external pricing engine.
 */
const MOCK_DELAY_MS = 2000;

/**
 * Returns fixture vehicle data but patches in the user-supplied plate and state
 * so the dialog/card shows the same info the user submitted.
 *
 * If the supplied plate matches a fixture entry's `licensePlate` (case
 * insensitive), that specific fixture vehicle is returned. Otherwise the
 * lookup falls back to the first fixture entry, preserving prior behavior for
 * unrecognized input.
 */
export async function mockLookupTradeInVehicle(
  plate: string,
  state: string
): Promise<TradeInVehicle | null> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  const normalizedPlate = plate.trim().toUpperCase();
  const matched = TRADE_IN_VEHICLES_FIXTURE.find(
    (vehicle) => vehicle.licensePlate.toUpperCase() === normalizedPlate
  );
  const base = matched ?? TRADE_IN_VEHICLES_FIXTURE[0];
  if (!base) {
    return null;
  }

  return {
    ...base,
    licensePlate: normalizedPlate,
    state: state.trim().toUpperCase(),
  };
}
