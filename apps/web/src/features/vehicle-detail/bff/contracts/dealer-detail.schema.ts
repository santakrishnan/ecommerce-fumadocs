import type { DealerInfo } from "@ucmp/sdk-search-api";

export interface DealerHoursEntry {
  close: string | null;
  day: string;
  open: string | null;
}

export interface DealerImage {
  alt?: string;
  type: "photo" | "map" | "map-thumbnail";
  url: string;
}

export interface DealerExtended {
  address: { line1: string; city: string; state: string; zip: string };
  hours?: { statusText: string; isOpenNow: boolean; weekly: DealerHoursEntry[] };
  images?: DealerImage[];
  phone?: string;
  rating?: { value: number; count: number };
  testDrive?: { dayLabel: string; date: string; slots: string[] } | null;
}

export type VdpDealer = DealerInfo & { extended: DealerExtended | null };
