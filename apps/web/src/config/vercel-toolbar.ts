import { z } from "zod";

/** Cookie that opts a browser into the Vercel Toolbar. Set via `/demo-settings`. */
export const VERCEL_TOOLBAR_COOKIE = "demo-vercel-toolbar";

export const vercelToolbarSchema = z.enum(["on", "off"]);

export type VercelToolbarState = z.infer<typeof vercelToolbarSchema>;

export const DEFAULT_VERCEL_TOOLBAR_STATE: VercelToolbarState = "off";

interface VercelToolbarOption {
  description: string;
  title: string;
  value: VercelToolbarState;
}

export const VERCEL_TOOLBAR_OPTIONS: readonly VercelToolbarOption[] = [
  {
    value: "off",
    title: "Off",
    description: "Vercel Toolbar is not injected. Default.",
  },
  {
    value: "on",
    title: "On",
    description: "Injects the Vercel Toolbar for this browser (feedback, flags, Web Vitals).",
  },
] as const;

export function coerceVercelToolbarState(value: string | null | undefined): VercelToolbarState {
  const parsed = vercelToolbarSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_VERCEL_TOOLBAR_STATE;
}
