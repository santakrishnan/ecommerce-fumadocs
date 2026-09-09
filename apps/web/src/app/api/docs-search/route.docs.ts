import { createFromSource } from "fumadocs-core/search/server";
import { source } from "~/docs/source";

/** Full-text search for the docs dialog (Orama, built from the MDX content). */
export const { GET } = createFromSource(source, {
  language: "english",
});
