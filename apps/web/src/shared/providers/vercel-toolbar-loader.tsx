import "server-only";
import { VERCEL_TOOLBAR_COOKIE, vercelToolbarSchema } from "@config/vercel-toolbar";
import { VercelToolbar } from "@vercel/toolbar/next";
import { cookies } from "next/headers";

// Gates the toolbar on the demo-vercel-toolbar cookie instead of NODE_ENV
// Reads a request cookie, so this must render inside a <Suspense> boundary
export async function VercelToolbarLoader() {
  const cookieStore = await cookies();
  const parsed = vercelToolbarSchema.safeParse(cookieStore.get(VERCEL_TOOLBAR_COOKIE)?.value);

  if (!(parsed.success && parsed.data === "on")) {
    return null;
  }

  return <VercelToolbar />;
}
