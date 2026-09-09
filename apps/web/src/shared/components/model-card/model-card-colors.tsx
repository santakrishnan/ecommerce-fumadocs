"use client";

import { normalizeImageUrl } from "@shared/lib/media";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ucmp/ui";
import Image from "next/image";
import { useState } from "react";

interface ModelCardColorsProps {
  colors: { label: string; svgSrc: string }[];
}

interface ColorSwatchProps {
  label: string;
  svgSrc: string;
}

function ColorSwatch({ label, svgSrc }: ColorSwatchProps) {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip onOpenChange={setOpen} open={open}>
      <TooltipTrigger
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          setOpen((prev) => !prev);
          e.stopPropagation();
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        render={<span />}
      >
        <span className="relative inline-flex size-4 rounded-full">
          <Image
            alt={label}
            className="size-4 rounded-full"
            height={16}
            src={normalizeImageUrl(svgSrc)}
            width={16}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.20), transparent)",
            }}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent arrowClassName="hidden" className="bg-neutral-50/60 text-text-primary">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Color swatches row — renders available color icons with tooltip labels.
 * Client component: requires interactivity for tooltip hover/tap behavior.
 */
export function ModelCardColors({ colors }: ModelCardColorsProps) {
  if (colors.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-2 border-divider border-t py-3.5">
      <span className="font-normal text-text-primary text-xs leading-body tracking-tighter">
        Colors
      </span>
      <TooltipProvider>
        <div className="flex items-center gap-0.5">
          {colors.map((color) => (
            <ColorSwatch key={color.label} label={color.label} svgSrc={color.svgSrc} />
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
