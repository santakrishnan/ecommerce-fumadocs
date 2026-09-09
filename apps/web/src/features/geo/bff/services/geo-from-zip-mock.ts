import "server-only";

import type { FromZipRequest } from "../contracts/from-zip-request.schema";
import type { FromZipResponse } from "../contracts/from-zip-response.schema";

/**
 * Mock geo fromZip service for local development when API_UPSTREAM_URL is not set.
 * Returns realistic location data based on zip code region.
 */

const MOCK_DELAY_MS = 50;

const KNOWN_ZIPS: Record<string, FromZipResponse> = {
  "10001": {
    city: "New York",
    state: "New York",
    stateCode: "NY",
    zip: "10001",
    latitude: 40.7484,
    longitude: -73.9967,
  },
  "90210": {
    city: "Beverly Hills",
    state: "California",
    stateCode: "CA",
    zip: "90210",
    latitude: 34.0901,
    longitude: -118.4065,
  },
  "60601": {
    city: "Chicago",
    state: "Illinois",
    stateCode: "IL",
    zip: "60601",
    latitude: 41.8819,
    longitude: -87.6278,
  },
  "77001": {
    city: "Houston",
    state: "Texas",
    stateCode: "TX",
    zip: "77001",
    latitude: 29.7604,
    longitude: -95.3698,
  },
  "85001": {
    city: "Phoenix",
    state: "Arizona",
    stateCode: "AZ",
    zip: "85001",
    latitude: 33.4484,
    longitude: -112.074,
  },
  "33101": {
    city: "Miami",
    state: "Florida",
    stateCode: "FL",
    zip: "33101",
    latitude: 25.7617,
    longitude: -80.1918,
  },
};

const REGION_DEFAULTS: Record<string, FromZipResponse> = {
  "0": {
    city: "Hartford",
    state: "Connecticut",
    stateCode: "CT",
    zip: "06101",
    latitude: 41.76,
    longitude: -72.67,
  },
  "1": {
    city: "New York",
    state: "New York",
    stateCode: "NY",
    zip: "10001",
    latitude: 40.7484,
    longitude: -73.9967,
  },
  "2": {
    city: "Washington",
    state: "District of Columbia",
    stateCode: "DC",
    zip: "20001",
    latitude: 38.91,
    longitude: -77.02,
  },
  "3": {
    city: "Atlanta",
    state: "Georgia",
    stateCode: "GA",
    zip: "30301",
    latitude: 33.75,
    longitude: -84.39,
  },
  "4": {
    city: "Cincinnati",
    state: "Ohio",
    stateCode: "OH",
    zip: "45201",
    latitude: 39.1,
    longitude: -84.51,
  },
  "5": {
    city: "Minneapolis",
    state: "Minnesota",
    stateCode: "MN",
    zip: "55401",
    latitude: 44.98,
    longitude: -93.27,
  },
  "6": {
    city: "Chicago",
    state: "Illinois",
    stateCode: "IL",
    zip: "60601",
    latitude: 41.88,
    longitude: -87.63,
  },
  "7": {
    city: "Houston",
    state: "Texas",
    stateCode: "TX",
    zip: "77001",
    latitude: 29.76,
    longitude: -95.37,
  },
  "8": {
    city: "Phoenix",
    state: "Arizona",
    stateCode: "AZ",
    zip: "85001",
    latitude: 33.45,
    longitude: -112.07,
  },
  "9": {
    city: "Los Angeles",
    state: "California",
    stateCode: "CA",
    zip: "90001",
    latitude: 34.05,
    longitude: -118.24,
  },
};

const DEFAULT_LOCATION: FromZipResponse = {
  city: "New York",
  state: "New York",
  stateCode: "NY",
  zip: "10001",
  latitude: 40.7484,
  longitude: -73.9967,
};

/**
 * Resolves geo from zip code. Returns region-based mock data.
 */
export async function mockGeoFromZip(request: FromZipRequest): Promise<FromZipResponse> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  const { zip } = request;

  const known = KNOWN_ZIPS[zip];
  if (known) {
    return known;
  }

  const firstDigit = zip[0] as string;
  return REGION_DEFAULTS[firstDigit] ?? DEFAULT_LOCATION;
}
