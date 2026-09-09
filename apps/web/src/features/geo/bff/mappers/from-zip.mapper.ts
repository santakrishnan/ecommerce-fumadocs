import type {
  FromZipResponse,
  FromZipUpstreamResponse,
} from "../contracts/from-zip-response.schema";

/**
 * Maps the upstream /geo/fromZip response to the frontend FromZipResponse shape.
 */
export function mapFromZipUpstreamToResponse(upstream: FromZipUpstreamResponse): FromZipResponse {
  return {
    city: upstream.city,
    state: upstream.state,
    stateCode: upstream.stateCode,
    zip: upstream.zipCode,
    latitude: upstream.lat,
    longitude: upstream.lon,
  };
}
