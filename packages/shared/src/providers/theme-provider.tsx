"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export { useTheme } from "next-themes";

export type Theme = "light" | "dark" | "system";

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

// TODO Martin - revert post demo if we want to keep focused on dark mode but setting to light mode since that's what the designs are focused on today
export function ThemeProvider({ children, defaultTheme = "light" }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      disableTransitionOnChange
      enableSystem
    >
      {children}
    </NextThemesProvider>
  );
}
