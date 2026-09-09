"use client";

import { LinkCard } from "@shared/components/card";
import { Button, CardContent, CardFooter } from "@ucmp/ui";
import { IconArrowRight } from "@ucmp/ui/icons";
import Image from "next/image";
import type React from "react";
import { useCallback } from "react";
import { cn } from "utils";
import { useCategorySearch } from "../../context/category-search-context";
import type { CategoryCardData } from "../../types";

export interface CategoryCardLinkProps {
  className?: string;
  data: CategoryCardData;
}

const CATEGORY_SIZE_CLASSES = "aspect-[268/357] lg:aspect-[334/445]";

/**
 * Client wrapper for CategoryCard. On click, opens the search overlay
 * (in-page, no URL change) pre-filled with "show me {category name}".
 * Assigns view-transition-name to the footer so the browser morphs it
 * into the search input.
 */
export function CategoryCardLink({ data, className }: CategoryCardLinkProps) {
  const categorySearch = useCategorySearch();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const query = `show me ${data.name.toLowerCase()}`;
      categorySearch?.openWithQuery(query);
    },
    [categorySearch, data.name]
  );

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
        onClick: handleClick,
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
