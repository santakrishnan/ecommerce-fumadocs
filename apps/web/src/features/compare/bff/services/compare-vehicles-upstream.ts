import "server-only";

import type { ResolvedBedService } from "@config/bed-services";
import { createBedClient } from "@shared/lib/http/bed-client";
import type { CompareVehicle, CompareVehiclesResponse } from "../../types";

async function fetchCompareVehicles(
  service: ResolvedBedService,
  vins: string[]
): Promise<CompareVehicle[]> {
  const client = createBedClient(service);
  const response = await client.post<CompareVehiclesResponse>("/vehicles", { vins });
  return response.data.vehicles;
}

export { fetchCompareVehicles };
