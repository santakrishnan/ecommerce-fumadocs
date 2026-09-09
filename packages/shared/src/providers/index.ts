/**
 * Shared React Providers
 *
 * Reusable React context providers for sharing state across apps.
 *
 * Guidelines:
 * - Follow React 19 patterns (state/actions/meta structure)
 * - Export both Provider component and useContext hook
 * - Make providers composable and configurable
 * - Include "use client" directive for client components
 */

export type { Theme, ThemeProviderProps } from "./theme-provider";
export { ThemeProvider, useTheme } from "./theme-provider";
