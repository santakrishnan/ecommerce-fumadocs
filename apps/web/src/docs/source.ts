import { loader } from "fumadocs-core/source";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { defineDocs } from "fumadocs-mdx/macro";

/** Base path of the documentation site inside the app. */
export const DOCS_ROUTE = "/docs";

/**
 * Content collection for the design-system docs. `dir` is relative to the app
 * root (`apps/web`), so pages live in `apps/web/content/docs`.
 *
 * Compiled by `fumadocs-mdx` (see `next.config.ts`) — only when docs routes
 * are enabled, which is the case in `next dev` and `pnpm build:docs`.
 */
const docs = defineDocs({
  dir: "content/docs",
  docs: { schema: pageSchema },
  meta: { schema: metaSchema },
});

export const source = loader({
  baseUrl: DOCS_ROUTE,
  source: docs.toFumadocsSource(),
});
