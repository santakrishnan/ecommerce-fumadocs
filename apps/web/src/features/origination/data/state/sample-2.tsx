import { z } from "zod";
import { defineState } from "../../lib/state/define-state";
import { loadComplete } from "../../lib/state/event-creators";

// Matches what sample's onSubmit hands off via go("sample-2", { visitedSample, sampleText })
const dataSchema = z.object({
  sampleText: z.string(),
  visitedSample: z.boolean(),
});

async function fetchSampleData(): Promise<z.infer<typeof dataSchema>> {
  return { sampleText: "Fetched fresh because context.data didn't have it", visitedSample: false };
}

export default defineState({
  key: "sample-2",
  route: "/sample/2",
  transitions: [],
  final: true,
  dataSchema,

  // Reuses ctx.data if it already satisfies dataSchema, fetches fresh otherwise
  onEnter: async (ctx) => {
    const existing = dataSchema.safeParse(ctx.data);
    if (existing.success) {
      return loadComplete(existing.data);
    }
    return loadComplete(await fetchSampleData());
  },

  blocks: ({ fromContext }) => [
    { componentId: "sample", data: { text: fromContext("sampleText") } },
  ],
  actions: [],
});
