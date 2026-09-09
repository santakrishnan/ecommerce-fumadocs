import "server-only";

import type { FromCoordsRequest } from "../contracts/from-coords-request.schema";
import type { FromZipResponse } from "../contracts/from-zip-response.schema";

/**
 * Mock geo fromCoords service for local development when API_UPSTREAM_URL is
 * not set. Buckets the longitude into a coarse US region and returns that
 * region's representative location (same shape as the fromZip response).
 */

const MOCK_DELAY_MS = 50;

const REGIONS: { minLng: number; location: FromZipResponse }[] = [
  {
    minLng: -75,
    location: {
      city: "New York",
      state: "New York",
      stateCode: "NY",
      zip: "10001",
      latitude: 40.7484,
      longitude: -73.9967,
    },
  },
  {
    minLng: -85,
    location: {
      city: "Chicago",
      state: "Illinois",
      stateCode: "IL",
      zip: "60601",
      latitude: 41.8819,
      longitude: -87.6278,
    },
  },
  {
    minLng: -100,
    location: {
      city: "Houston",
      state: "Texas",
      stateCode: "TX",
      zip: "77001",
      latitude: 29.7604,
      longitude: -95.3698,
    },
  },
  {
    minLng: -115,
    location: {
      city: "Phoenix",
      state: "Arizona",
      stateCode: "AZ",
      zip: "85001",
      latitude: 33.4484,
      longitude: -112.074,
    },
  },
];

const PACIFIC_DEFAULT: FromZipResponse = {
  city: "Los Angeles",
  state: "California",
  stateCode: "CA",
  zip: "90001",
  latitude: 34.05,
  longitude: -118.24,
};

/**
 * Resolves the nearest region location from coordinates. Region-based mock.
 */
export async function mockGeoFromCoords(request: FromCoordsRequest): Promise<FromZipResponse> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  const region = REGIONS.find(({ minLng }) => request.longitude > minLng);
  return region?.location ?? PACIFIC_DEFAULT;
}
