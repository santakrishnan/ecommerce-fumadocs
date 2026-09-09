import "server-only";

import { IMAGE_BASE_URL } from "@config/images";
import type { VdpSimilarVehicles } from "../contracts/vdp-response.schema";

const MOCK_DELAY_MS = 40;

interface SimilarEntry {
  ctaLink: string;
  imageAlt: string;
  imageUrl: string;
  make: string;
  mileage: number;
  model: string;
  price: number;
  trim: string;
  vin: string;
  year: number;
}

const SIMILAR_POOL: SimilarEntry[] = [
  {
    vin: "5TDKZRFH8NS112233",
    make: "Toyota",
    model: "Highlander",
    year: 2023,
    trim: "Hybrid XLE",
    price: 28_990,
    mileage: 42_100,
    imageUrl: `${IMAGE_BASE_URL}/inventory-card/inventory-card3.png`,
    imageAlt: "2023 Toyota Highlander Hybrid XLE",
    ctaLink: "/used-cars/details/toyota/highlander/hybrid-xle/2023/5TDKZRFH8NS112233",
  },
  {
    vin: "4T1G11AK5NU445566",
    make: "Toyota",
    model: "Highlander",
    year: 2022,
    trim: "Hybrid Platinum",
    price: 34_500,
    mileage: 18_700,
    imageUrl: `${IMAGE_BASE_URL}/inventory-card/inventory-card4.png`,
    imageAlt: "2022 Toyota Highlander Hybrid Platinum",
    ctaLink: "/used-cars/details/toyota/highlander/hybrid-platinum/2022/4T1G11AK5NU445566",
  },
  {
    vin: "JTMW1RFV0RD345003",
    make: "Toyota",
    model: "RAV4",
    year: 2024,
    trim: "Hybrid XSE",
    price: 33_200,
    mileage: 8400,
    imageUrl: `${IMAGE_BASE_URL}/inventory-card/inventory-card2.png`,
    imageAlt: "2024 Toyota RAV4 Hybrid XSE",
    ctaLink: "/used-cars/details/toyota/rav4/hybrid-xse/2024/JTMW1RFV0RD345003",
  },
];

/**
 * Mock similar vehicles — filters the pool by make, excludes the current VIN.
 * In production, this would call `POST /search` filtered by make + bodyStyle.
 */
export async function mockSimilarVehicles(
  make: string,
  _bodyStyle: string | undefined,
  excludeVin: string
): Promise<VdpSimilarVehicles> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  const filtered = SIMILAR_POOL.filter(
    (v) => v.make.toLowerCase() === make.toLowerCase() && v.vin !== excludeVin.toUpperCase()
  );

  return { results: filtered, totalCount: filtered.length };
}
