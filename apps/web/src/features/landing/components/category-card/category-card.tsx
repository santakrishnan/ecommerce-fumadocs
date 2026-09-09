import { LinkCard } from "@shared/components/card";
import { Button, CardContent, CardFooter } from "@ucmp/ui";
import { IconArrowRight } from "@ucmp/ui/icons";
import Image from "next/image";
import { cn } from "utils";
import type { CategoryCardData } from "../../types";

export interface CategoryCardProps {
  className?: string;
  data: CategoryCardData;
}

/**
 * Card-local dimension classes (single source of truth for this card's size),
 * mirroring the `EDITORIAL_SIZE_CLASSES` / `DEALER_OFFER_SIZE_CLASSES` pattern.
 * Category is a stacked card (image box + text footer), so it intentionally does
 * not compose the overlay `MediaCard` base — see ADR-0003.
 */
const CATEGORY_SIZE_CLASSES = "aspect-[268/357] lg:aspect-[334/445]";

export function CategoryCard({ data, className }: CategoryCardProps) {
  return (
    <LinkCard
      className={cn(
        CATEGORY_SIZE_CLASSES,
        "w-full shrink-0 justify-between gap-0 border-none bg-surface-primary px-4 py-6 shadow-none ring-0",
        "lg:px-6 lg:py-8",
        className
      )}
      data-slot="category-card"
      data-surface="light"
      linkProps={{
        "aria-label": `Shop ${data.name}`,
        href: data.shopUrl,
      }}
      wrapperClassName="group/category"
    >
      <CardContent className="relative w-full flex-1 p-0">
        <Image
          alt={data.imageAlt}
          className="object-contain"
          fill
          sizes="(max-width: 768px) 70vw, (max-width: 1024px) 35vw, 334px"
          src={data.imageUrl}
        />
      </CardContent>

      <CardFooter className="flex-col items-start gap-2.5 p-0 lg:gap-3">
        <h3 className="h3 text-text-primary">{data.name}</h3>
        <p className="body-sm lg:body-md text-text-secondary">{data.description}</p>
        <Button
          className="p-0"
          nativeButton={false}
          render={<span aria-hidden="true" />}
          size="sm"
          trailingIcon={IconArrowRight}
          variant="text"
        >
          Shop now
        </Button>
      </CardFooter>
    </LinkCard>
  );
}
