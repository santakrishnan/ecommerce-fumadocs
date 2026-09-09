import { AttributeStatList, type SpecAttribute } from "@shared/components/card";
import { normalizeImageUrl } from "@shared/lib/media";
import { CardContent, CardHeader } from "@ucmp/ui";
import Image from "next/image";
import { cn } from "utils";

interface SpecCardContentProps {
  /**
   * How attribute rows are laid out.
   * - `"grouped"` (default): count-based layout (1 hero, 2 columns, 3+ divided list).
   * - `"list"`: a single consistent divided list regardless of count.
   * @default "grouped"
   */
  attributeLayout?: "grouped" | "list";
  /** Available stock count for this option. */
  availableCount?: number;
  /** Optional vehicle/concept image. */
  image?: { src: string; alt: string };
  /** Image render box classes. */
  imageClassName?: string;
  imageHeight?: number;
  imageSizes?: string;
  imageWidth?: number;
  /**
   * Optional cap on how many specs to display, driven by the BFF `specCount`
   * field. When omitted, every spec renders.
   * @default specs.length
   */
  specCount?: number;
  /** Standard spec rows — rendered one row per attribute, up to `specCount`. */
  specs?: SpecAttribute[];
  /** Card subtitle (below title). */
  subtitle?: string;
  /** Card title. */
  title: string;
}

function SpecCardContent({
  attributeLayout = "grouped",
  availableCount,
  image,
  imageClassName,
  imageHeight = 126,
  imageSizes,
  imageWidth = 308,
  specs = [],
  specCount,
  subtitle,
  title,
}: SpecCardContentProps) {
  const visibleSpecs = specs.slice(0, specCount ?? specs.length);
  const imageSrc = image ? normalizeImageUrl(image.src) : undefined;

  return (
    <>
      <CardHeader className="flex h-34.75 w-full p-0 xl:h-51.25">
        {imageSrc && (
          <Image
            alt={image?.alt ?? title}
            className={cn(
              "aspect-49/20 h-9 w-auto object-contain lg:h-24.25 xl:h-31.5",
              imageClassName
            )}
            height={imageHeight}
            sizes={imageSizes ?? "(min-width: 1440px) 308px, 238px"}
            src={imageSrc}
            width={imageWidth}
          />
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col p-0">
        <div className="flex h-24 flex-col">
          {availableCount != null && availableCount >= 0 && (
            <span className="mb-1 font-normal text-text-secondary text-xs leading-body tracking-wide">
              {availableCount} available
            </span>
          )}

          <h3 className="vehicle-title-md line-clamp-2 max-h-[2lh] text-text-primary">{title}</h3>

          {subtitle && (
            <p className="body-small mt-2 line-clamp-2 max-h-[2lh] font-normal text-text-primary leading-body tracking-tighter">
              {subtitle}
            </p>
          )}
        </div>

        <div className="mb-auto pt-6">
          <AttributeStatList attributes={visibleSpecs} layout={attributeLayout} />
        </div>
      </CardContent>
    </>
  );
}

export type { SpecAttribute } from "@shared/components/card";
export { SpecCardContent, type SpecCardContentProps };
