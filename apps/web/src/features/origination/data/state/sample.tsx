import { z } from "zod";
import { defineState } from "../../lib/state/define-state";
import { go, loadComplete } from "../../lib/state/event-creators";

// Defines the data that will be provided by onEntry, and available to component
// blocks via fromContext
const dataSchema = z.object({
  sampleText: z.string(),
});

// Schema provided to react-hook-form and used to validate form submission
// before onSubmit is called, guarantees onSubmit formData type
const formSchema = z.object({
  favoriteColor: z.string().min(1, "Tell us your favorite color"),
});

export default defineState({
  key: "sample",
  route: "/sample",
  transitions: ["sample-2"],
  dataSchema,
  formSchema,

  onEnter: async () => loadComplete({ sampleText: "This is sample text!" }),

  blocks: ({ fromContext }) => [
    { componentId: "sample", data: { text: fromContext("sampleText") } },
    { componentId: "sample-text-field", data: { name: "favoriteColor", label: "Favorite color" } },
  ],
  actions: [
    { label: "Skip", submit: false, target: "sample-2" },
    { label: "Next", variant: "primary", target: "sample-2" },
  ],

  // go's output replaces ctx.data rather than merging, so spread it forward
  onSubmit: async (_formData, _additionalFormData, ctx, target) =>
    go(target || "sample-2", {
      ...ctx.data,
      visitedSample: true,
    }),
});
