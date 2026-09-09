"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

/**
 * Theme toggle — sun / moon / system trio backed by next-themes.
 *
 * Wiring contract:
 * - The host app MUST wrap the tree in `<ThemeProvider>` from
 *   `@ucmp/shared/providers` (which configures `attribute="class"`).
 * - This component reads `theme` (user selection: light | dark | system) and
 *   shows the *resolved* theme in the trigger icon via `resolvedTheme`
 *   (always `"light"` or `"dark"`).
 *
 * SSR note: the dropdown's selected radio value is rendered after mount to
 * avoid hydration mismatch — server doesn't know the user's localStorage
 * preference, so we render a neutral trigger until the client tells us.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button aria-label="Toggle theme" size="icon" variant="text">
            {isDark ? <Moon /> : <Sun />}
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup onValueChange={setTheme} value={mounted ? theme : undefined}>
          <DropdownMenuRadioItem value="light">
            <Sun className="size-4" />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="size-4" />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor className="size-4" />
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
