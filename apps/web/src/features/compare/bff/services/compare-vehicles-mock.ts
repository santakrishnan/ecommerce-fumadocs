import "server-only";

import {
  COMPARE_VEHICLES_FIXTURE,
  makeCompareVehicle,
} from "../../__fixtures__/compare-vehicles.fixture";
import type { CompareVehicle } from "../../types";

const MOCK_DELAY_MS = 50;

async function mockDelay(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
}

function synthesizeCompareVehicle(vin: string, index: number): CompareVehicle {
  const template = COMPARE_VEHICLES_FIXTURE[index % COMPARE_VEHICLES_FIXTURE.length];
  return makeCompareVehicle({ ...template, vin });
}

async function mockFetchCompareVehicles(vins: string[]): Promise<CompareVehicle[]> {
  await mockDelay();
  return vins.map((vin, index) => synthesizeCompareVehicle(vin, index));
}

export { mockFetchCompareVehicles };
