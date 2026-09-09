import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper precedence.
 *
 * NOTE: This file exists as a local alias for shadcn component imports
 * (`@/lib/utils`). The canonical implementation lives in `packages/utils/src/cn.ts`.
 * Both are kept in sync — do not diverge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
