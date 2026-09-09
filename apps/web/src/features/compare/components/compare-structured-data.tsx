import type { ReactNode } from "react";
import { toVehicleLabel } from "../lib/compare-metadata";
import type { CompareVehicle } from "../types";

export interface VehicleJsonLdOffer {
  "@type": "Offer";
  price: number;
  priceCurrency: string;
}

export interface VehicleJsonLd {
  "@context": "https://schema.org";
  "@type": "Vehicle";
  brand: string;
  model: string;
  name: string;
  offers?: VehicleJsonLdOffer;
  vehicleIdentificationNumber: string;
  vehicleModelDate: number;
}

/** Maps a CompareVehicle to a schema.org Vehicle JSON-LD object, omitting unavailable facts. */
export function toVehicleJsonLd(vehicle: CompareVehicle): VehicleJsonLd {
  const name = toVehicleLabel(vehicle);
  const price = vehicle.pricing?.sellingPrice;
  const hasPrice = typeof price === "number" && Number.isFinite(price);

  // Fields whose source value is missing/empty/nullish are left off the node.
  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    ...(name ? { name } : {}),
    ...(vehicle.make ? { brand: vehicle.make } : {}),
    ...(vehicle.model ? { model: vehicle.model } : {}),
    ...(Number.isFinite(vehicle.year) ? { vehicleModelDate: vehicle.year } : {}),
    ...(vehicle.vin ? { vehicleIdentificationNumber: vehicle.vin } : {}),
    ...(hasPrice ? { offers: { "@type": "Offer", price, priceCurrency: "USD" } } : {}),
  } as VehicleJsonLd;
}

/** Escapes a serialized JSON string so it cannot break out of a <script> context. */
export function escapeJsonLd(json: string): string {
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** Server Component: renders one <script type="application/ld+json"> per vehicle. */
export function CompareStructuredData({ vehicles }: { vehicles: CompareVehicle[] }): ReactNode {
  if (vehicles.length === 0) {
    return null;
  }

  return vehicles.map((vehicle, index) => {
    const json = escapeJsonLd(JSON.stringify(toVehicleJsonLd(vehicle)));

    return (
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: sanctioned JSON-LD pattern — a serialized, escaped JSON object we control, never user HTML.
        dangerouslySetInnerHTML={{ __html: json }}
        // biome-ignore lint/suspicious/noArrayIndexKey: VINs can repeat across compared columns; index keeps the React key unique.
        key={`${vehicle.vin}-${index}`}
        type="application/ld+json"
      />
    );
  });
}
