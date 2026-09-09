import { IconToyotaX } from "@ucmp/ui/icons";
import { cn } from "utils";
import type { Surface } from "@/lib/types";

export interface HeroSectionProps {
  brandMarkClassName?: string;
  children?: React.ReactNode;
  className?: string;
  headingId?: string;
  headline?: string;
  subheadline?: string;
  subheadlineClassName?: string;
  surface?: Surface;
}

export function HeroSection({
  headline,
  subheadline,
  brandMarkClassName,
  children,
  className,
  headingId = "hero-heading",
  subheadlineClassName,
  surface = "light",
}: HeroSectionProps) {
  return (
    <section
      aria-label={headline ? undefined : "Introduction"}
      aria-labelledby={headline ? headingId : undefined}
      className={cn(
        "mx-auto flex w-full flex-col items-center pb-6 text-center md:pt-14 md:pb-8 lg:pt-20 lg:pb-12",
        className
      )}
      data-surface={surface}
    >
      <IconToyotaX className={cn("m-2 size-10 text-brand", brandMarkClassName)} />

      {headline && (
        <h1 className="h1 text-text-primary" id={headingId}>
          {headline}
        </h1>
      )}

      {subheadline && (
        <p
          className={cn(
            "mt-4 text-text-primary",
            !subheadlineClassName && "body-lg",
            subheadlineClassName
          )}
        >
          {subheadline}
        </p>
      )}

      {children && <div className="mt-8 w-full">{children}</div>}
    </section>
  );
}
