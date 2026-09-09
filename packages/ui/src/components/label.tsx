"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface LabelProps extends React.ComponentProps<"label"> {}

function Label({ className, ...props }: LabelProps) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium text-text-primary select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:text-text-inactive peer-disabled:cursor-not-allowed peer-disabled:text-text-inactive",
        className
      )}
      {...props}
    />
  )
}

export { Label }
export type { LabelProps }
