import type { FromZipUpstreamResponse } from "../contracts/from-zip-response.schema";

/**
 * Fixture data representing typical upstream /geo/v1/fromZip responses for testing.
 * The real API wraps these in a `{ data, meta }` envelope.
 */

export const NYC_UPSTREAM_RESPONSE: FromZipUpstreamResponse = {
  city: "New York",
  state: "New York",
  stateCode: "NY",
  zipCode: "10001",
  lat: 40.7484,
  lon: -73.9967,
};

export const LA_UPSTREAM_RESPONSE: FromZipUpstreamResponse = {
  city: "Los Angeles",
  state: "California",
  stateCode: "CA",
  zipCode: "90001",
  lat: 34.0522,
  lon: -118.2437,
};

export const CHICAGO_UPSTREAM_RESPONSE: FromZipUpstreamResponse = {
  city: "Chicago",
  state: "Illinois",
  stateCode: "IL",
  zipCode: "60601",
  lat: 41.8819,
  lon: -87.6278,
};

/**
 * Wraps a flat upstream response in the envelope shape returned by the real API.
 */
export function wrapInEnvelope(data: FromZipUpstreamResponse) {
  return {
    data,
    meta: {
      traceId: "test-trace-id-fixture",
      timestamp: new Date().toISOString(),
    },
  };
}
