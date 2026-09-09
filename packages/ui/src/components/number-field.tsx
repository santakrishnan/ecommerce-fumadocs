"use client";

import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import { Minus, Plus } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const NumberField = React.forwardRef<
  React.ComponentRef<typeof BaseNumberField.Root>,
  React.ComponentPropsWithoutRef<typeof BaseNumberField.Root>
>(({ children, className, ...props }, ref) => (
  <BaseNumberField.Root
    className={cn(
      "inline-flex items-center rounded-md border border-input bg-background text-sm",
      className
    )}
    ref={ref}
    {...props}
  >
    {children ?? (
      <>
        <BaseNumberField.Decrement className="flex size-9 items-center justify-center rounded-l-md border-r border-input transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50">
          <Minus className="size-4" />
        </BaseNumberField.Decrement>
        <BaseNumberField.Input className="h-9 w-16 bg-transparent px-2 text-center focus:outline-none disabled:cursor-not-allowed disabled:opacity-50" />
        <BaseNumberField.Increment className="flex size-9 items-center justify-center rounded-r-md border-l border-input transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50">
          <Plus className="size-4" />
        </BaseNumberField.Increment>
      </>
    )}
  </BaseNumberField.Root>
));
NumberField.displayName = "NumberField";

const NumberFieldDecrement = BaseNumberField.Decrement;
const NumberFieldIncrement = BaseNumberField.Increment;
const NumberFieldInput = BaseNumberField.Input;
const NumberFieldGroup = BaseNumberField.Group;
const NumberFieldScrubArea = BaseNumberField.ScrubArea;
const NumberFieldScrubAreaCursor = BaseNumberField.ScrubAreaCursor;

export {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldScrubArea,
  NumberFieldScrubAreaCursor,
};
