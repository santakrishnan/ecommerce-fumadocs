import "server-only";

import { DEALER_BAY_RIDGE } from "../../__fixtures__/dealer-info-dialog.fixture";
import type { DealerExtended } from "../contracts/dealer-detail.schema";

const MOCK_DELAY_MS = 30;

/**
 * Mock dealer details — returns a fixture DealerInfoData mapped to DealerExtended.
 */
export async function mockDealerDetail(_dealerCode: string): Promise<DealerExtended | null> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  const fixture = DEALER_BAY_RIDGE;

  return {
    address: fixture.address,
    phone: fixture.phone,
    rating: fixture.rating,
    hours: fixture.hours,
    images: fixture.images,
    testDrive: fixture.testDrive,
  };
}
