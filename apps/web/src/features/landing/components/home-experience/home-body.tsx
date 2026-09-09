import { connection } from "next/server";
import { resolveHomeExperience } from "../../services/resolve-home-experience";
import { BODY } from "./home-experience";

export interface HomeBodyProps {
  /** DEV-only `?exp=` override, forwarded to the mode resolver. */
  searchParams: Promise<{ exp?: string | string[] }>;
}

/**
 * Streamed home body — the single dynamic hole on `/`.
 *
 * Resolves the visitor mode (which also **extends the VPS session**) and renders
 * the matching body slot. Lapsed returns are redirected to `/welcome-back` at the
 * edge (`proxy.ts`) before this runs, so only `first-visit` and `recent-return`
 * normally reach here; a `lapsed-return` that slips through (e.g. the
 * `_ucmp_last_visit_at` cookie was cleared) degrades gracefully to the welcome
 * body via the shared `BODY` map — no redirect, since the shell has already
 * streamed.
 */
export async function HomeBody({ searchParams }: HomeBodyProps) {
  await connection();
  const { exp } = await searchParams;
  const override = Array.isArray(exp) ? exp[0] : exp;
  const mode = await resolveHomeExperience(override);
  const Body = BODY[mode];
  return <Body />;
}
