import { type Spec, SpecList } from "@shared/components/card/spec-list";
import { ModelCardColors } from "@shared/components/model-card/model-card-colors";
import { normalizeImageUrl } from "@shared/lib/media";
import { CardContent, CardHeader } from "@ucmp/ui";
import Image from "next/image";
import { cn } from "utils";

export interface ModelCardContentProps {
  /** Available stock count for this model. */
  availableCount?: number;
  /** Average price display string */
  averagePrice?: string;
  /** Seating/passenger capacity */
  capacity?: string;
  /** Vehicle image URL (required) */
  carImage: string;
  /** Available color options — rendered below specs, not in SpecList. */
  colors?: { label: string; svgSrc: string }[];
  /** Short description below the title. */
  description?: string;
  /** Fuel efficiency display string (e.g. "31 MPG combined") */
  fuelEfficiency?: string;
  /** Image render box classes. */
  imageClassName?: string;
  imageHeight?: number;
  imageSizes?: string;
  imageWidth?: number;
  /** Vehicle title (e.g. "Highlander"). */
  title: string;
  /** Model year (required). */
  year: string | number;
}

/**
 * Visual content for a model card — isolate image, year, title, description,
 * spec rows, and color swatches. No shell, no interactivity.
 * Compose inside LinkCard/ButtonCard.
 */
export function ModelCardContent({
  availableCount,
  averagePrice,
  capacity,
  carImage,
  colors,
  description,
  fuelEfficiency,
  imageClassName,
  imageHeight = 126,
  imageSizes,
  imageWidth = 308,
  title,
  year,
}: ModelCardContentProps) {
  const imageSrc = normalizeImageUrl(carImage);

  // Build specs array from individual props
  const specs: Spec[] = [];
  if (fuelEfficiency) {
    specs.push({ label: "Fuel efficiency", value: fuelEfficiency });
  }
  if (capacity) {
    specs.push({ label: "Capacity", value: capacity });
  }
  if (averagePrice) {
    specs.push({ label: "Average price", value: averagePrice });
  }

  return (
    <>
      <CardHeader className="mb-2 flex h-[139px] w-full items-center justify-center p-0 lg:mb-0 xl:h-[205px]">
        <Image
          alt={title}
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

        <span className="mb-2 font-normal text-text-secondary text-xs leading-body tracking-wide">
          {year}
        </span>

        <h3 className="mb-2 font-bold text-base text-text-primary uppercase leading-heading tracking-tightest lg:text-2xl">
          {title}
        </h3>

        {description && (
          <p className="font-normal text-text-primary text-xs leading-body tracking-tighter">
            {description}
          </p>
        )}

        {specs.length > 0 && <SpecList className="mt-2 xl:mt-6" specs={specs} />}

        {colors && colors.length > 0 && <ModelCardColors colors={colors} />}
      </CardContent>
    </>
  );
}
