"use server";

import { VERCEL_TOOLBAR_COOKIE, vercelToolbarSchema } from "@config/vercel-toolbar";
import { cookies } from "next/headers";

/** One year in seconds — the cookie persists across browser sessions. */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export interface SetVercelToolbarResult {
  success: boolean;
}

// Server Actions are publicly callable and types are erased at runtime, so
// validate here even though the picker only ever sends "on" | "off".
export async function setVercelToolbar(value: string): Promise<SetVercelToolbarResult> {
  const parsed = vercelToolbarSchema.safeParse(value);
  if (!parsed.success) {
    return { success: false };
  }

  const cookieStore = await cookies();
  cookieStore.set(VERCEL_TOOLBAR_COOKIE, parsed.data, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return { success: true };
}

export async function resetVercelToolbar(): Promise<SetVercelToolbarResult> {
  const cookieStore = await cookies();
  cookieStore.delete(VERCEL_TOOLBAR_COOKIE);
  return { success: true };
}
