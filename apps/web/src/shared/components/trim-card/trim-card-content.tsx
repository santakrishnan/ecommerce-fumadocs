import { type Spec, SpecList } from "@shared/components/card/spec-list";
import { normalizeImageUrl } from "@shared/lib/media";
import { CardContent, CardHeader } from "@ucmp/ui";
import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "utils";

export interface TrimCardContentProps {
  /** Available stock count for this trim. */
  availableCount?: number;
  /** Optional top-left badge slot (e.g. "Recommended" pill). */
  badge?: ReactNode;
  /** Short description below the title (e.g. "Starting at $28,950"). */
  description?: string;
  /** Transparent vehicle render image. */
  image: { src: string; alt: string };
  /** Image render box classes. */
  imageClassName?: string;
  imageHeight?: number;
  imageSizes?: string;
  imageWidth?: number;
  /** Label/value spec rows (e.g. MSRP, MPG, Horsepower). */
  specs?: Spec[];
  /** Trim name (e.g. "LE", "XLE", "Limited"). */
  title: string;
  /** Model year. */
  year?: string | number;
}

/**
 * Visual content for a trim card — isolate image, year, title, description,
 * and spec rows. No shell, no interactivity. Compose inside LinkCard/ButtonCard.
 */
export function TrimCardContent({
  availableCount,
  badge,
  description,
  image,
  imageClassName,
  imageHeight = 126,
  imageSizes,
  imageWidth = 308,
  specs,
  title,
  year,
}: TrimCardContentProps) {
  const imageSrc = normalizeImageUrl(image.src);

  return (
    <>
      {badge}

      <CardHeader className="mb-2 flex h-[139px] w-full items-center justify-center p-0 lg:mb-0 xl:h-[205px]">
        <Image
          alt={image.alt}
          className={cn(
            "h-[97px] w-[238px] object-contain xl:h-[126px] xl:w-[308px]",
            imageClassName
          )}
          height={imageHeight}
          sizes={imageSizes ?? "(min-width: 1440px) 308px, 238px"}
          src={imageSrc}
          width={imageWidth}
        />
      </CardHeader>

      <CardContent className="flex flex-col p-0">
        {availableCount != null && availableCount >= 0 && (
          <span className="mb-1 font-normal text-text-secondary text-xs leading-body tracking-wide">
            {availableCount} available
          </span>
        )}

        {year != null && (
          <span className="mb-2 font-normal text-text-secondary text-xs leading-body tracking-wide">
            {year}
          </span>
        )}

        <h3 className="mb-2 font-bold text-base text-text-primary uppercase leading-heading tracking-tightest lg:text-2xl">
          {title}
        </h3>

        {description && (
          <p className="font-normal text-text-primary text-xs leading-body tracking-tighter">
            {description}
          </p>
        )}

        {specs && specs.length > 0 && <SpecList className="mt-2 xl:mt-6" specs={specs} />}
      </CardContent>
    </>
  );
}
