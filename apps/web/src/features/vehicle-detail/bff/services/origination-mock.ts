import "server-only";

import { ORIGINATION_FIXTURES } from "../../__fixtures__/origination.fixtures";
import { DEFAULT_ORIGINATION, VDP_ORIGINATION_BY_VIN } from "../../__fixtures__/vdp-demo-registry";
import type { Origination } from "../../types";

const MOCK_DELAY_MS = 30;

/**
 * Mock origination — returns fixture payment state keyed by VIN.
 */
export async function mockOrigination(
  vin: string,
  _visitorId: string | null
): Promise<Origination> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  const kind = VDP_ORIGINATION_BY_VIN[vin.toUpperCase()] ?? DEFAULT_ORIGINATION;
  return ORIGINATION_FIXTURES[kind];
}
