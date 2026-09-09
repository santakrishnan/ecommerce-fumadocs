"use client";

import { MoonIcon, PaletteIcon, SunIcon } from "lucide-react";
import { cn } from "utils";
import { toolbarButton } from "./preview-toolbar";

export type ColorMode = "light" | "dark";

export interface ThemeControlsProps {
  /** Available brand themes; omit to hide the brand picker. */
  brand?: string;
  brands?: string[];
  mode: ColorMode;
  onBrandChange?: (brand: string) => void;
  onModeChange: (mode: ColorMode) => void;
}

/**
 * Light/dark and brand switches for a preview. Both act on the *real* theme
 * tokens: dark toggles the `.dark` token set from `@ucmp/ui-theme`, brand
 * layers that brand's override files from `packages/ui-theme/themes/<brand>`.
 */
export function ThemeControls({
  brand,
  brands,
  mode,
  onBrandChange,
  onModeChange,
}: ThemeControlsProps) {
  const showBrands = brands !== undefined && brands.length > 1 && onBrandChange !== undefined;

  return (
    <div className="flex items-center gap-1">
      <fieldset aria-label="Color mode" className="flex items-center gap-0.5">
        <button
          aria-pressed={mode === "light"}
          className={cn(toolbarButton, "size-7 justify-center px-0")}
          onClick={() => onModeChange("light")}
          title="Light mode"
          type="button"
        >
          <SunIcon className="size-3.5" />
          <span className="sr-only">Light</span>
        </button>
        <button
          aria-pressed={mode === "dark"}
          className={cn(toolbarButton, "size-7 justify-center px-0")}
          onClick={() => onModeChange("dark")}
          title="Dark mode"
          type="button"
        >
          <MoonIcon className="size-3.5" />
          <span className="sr-only">Dark</span>
        </button>
      </fieldset>
      {showBrands && (
        <label className="flex items-center gap-1" title="Brand theme (packages/ui-theme/themes)">
          <PaletteIcon className="size-3.5 text-fd-muted-foreground" />
          <span className="sr-only">Brand</span>
          <select
            className="h-7 rounded-md border border-fd-border bg-fd-background px-1.5 text-fd-foreground text-xs outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
            onChange={(e) => onBrandChange(e.target.value)}
            value={brand}
          >
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
