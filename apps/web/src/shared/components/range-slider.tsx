"use client";

import { Slider } from "@ucmp/ui";
import type { ComponentProps } from "react";

export interface RangeSliderProps extends ComponentProps<typeof Slider> {
  formatValue: (value: number) => string;
  max: number;
  min: number;
}

export function RangeSlider({ formatValue, min, max, ...props }: RangeSliderProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <Slider max={max} min={min} {...props} />
      <div className="body-lg flex justify-between text-text-secondary">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
}
