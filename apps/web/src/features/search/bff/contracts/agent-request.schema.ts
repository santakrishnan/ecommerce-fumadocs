import { agentVersionSchema } from "@config/agent-backend";
import { z } from "zod";
import { isMockNotFoundSearchId } from "../../lib/mock-not-found-search-ids";

const LocationSchema = z.object({
  zipCode: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const searchIdSchema = z
  .string()
  .refine((value) => z.string().uuid().safeParse(value).success || isMockNotFoundSearchId(value), {
    message: "Invalid search id",
  });

/**
 * Agent search request. `agentVersion` reuses {@link agentVersionSchema} from
 * config; `looseObject` lets a card's flattened `nextSearchPlan` fields pass
 * through (responseMode, explorationAxes, intentReset, …).
 */
export const AgentSearchRequestSchema = z.looseObject({
  query: z.string().optional(),
  searchId: searchIdSchema.optional(),
  location: LocationSchema.optional(),
  filters: z.array(z.record(z.string(), z.unknown())).optional(),
  debug: z.record(z.string(), z.unknown()).optional(),
  agentVersion: agentVersionSchema.optional(),
});

export type AgentSearchRequest = z.infer<typeof AgentSearchRequestSchema>;

// One canonical `AgentVersion` (SDK-sourced, via config).
export type { AgentVersion } from "@config/agent-backend";
