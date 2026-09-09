import * as React from "react"

import { cn } from "@/lib/utils"

import type { IconProps } from "./icon-wrapper"

const IconStar = React.forwardRef<SVGSVGElement, IconProps>(
  ({ className, size, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 14 13"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      data-slot="icon"
      className={cn("shrink-0", className)}
      {...props}
    >
      <path
        d="M6.13729 0.336933C6.28281 -0.110927 6.91641 -0.110925 7.06193 0.336934L8.28658 4.10603C8.35166 4.30632 8.53831 4.44193 8.7489 4.44193H12.712C13.1829 4.44193 13.3787 5.04452 12.9977 5.32131L9.79151 7.65074C9.62113 7.77453 9.54984 7.99394 9.61492 8.19423L10.8396 11.9633C10.9851 12.4112 10.4725 12.7836 10.0915 12.5068L6.88534 10.1774C6.71496 10.0536 6.48426 10.0536 6.31388 10.1774L3.10769 12.5068C2.72672 12.7836 2.21413 12.4112 2.35965 11.9633L3.5843 8.19423C3.64938 7.99394 3.57809 7.77453 3.40771 7.65074L0.201523 5.32131C-0.179449 5.04452 0.0163461 4.44193 0.487253 4.44193H4.45032C4.66091 4.44193 4.84756 4.30632 4.91264 4.10603L6.13729 0.336933Z"
        fill="currentColor"
      />
    </svg>
  )
)

IconStar.displayName = "IconStar"

export { IconStar }
