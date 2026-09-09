import * as React from "react"

import { cn } from "@/lib/utils"
import { IconStar } from "@/icons/star"

interface RatingProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number
  max?: number
  precision?: number
  icon?: React.ReactElement
  emptyIcon?: React.ReactElement
}

function roundToPrecision(value: number, precision: number): number {
  return Math.round(value / precision) * precision
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

const DEFAULT_ICON = <IconStar className="size-4 text-brand" />
const DEFAULT_EMPTY_ICON = <IconStar className="size-4 text-text-tertiary" />

function Rating({
  value,
  max = 5,
  precision = 0.25,
  icon = DEFAULT_ICON,
  emptyIcon = DEFAULT_EMPTY_ICON,
  className,
  "aria-label": ariaLabel,
  ...props
}: RatingProps) {
  const effectivePrecision = clamp(precision, 0.01, max)
  const rounded = clamp(roundToPrecision(value, effectivePrecision), 0, max)
  const label = ariaLabel ?? `${rounded} out of ${max} stars`

  return (
    <span
      role="img"
      aria-label={label}
      data-slot="rating"
      className={cn("inline-flex items-center", className)}
      {...props}
    >
      {Array.from({ length: max }, (_, index) => {
        const fillPercent = clamp((rounded - index) * 100, 0, 100)

        return (
          <span key={index} data-slot="rating-item" className="relative inline-flex">
            {emptyIcon}
            {fillPercent > 0 && (
              <span
                aria-hidden="true"
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercent}%` }}
              >
                {icon}
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

export { Rating }
export type { RatingProps }
