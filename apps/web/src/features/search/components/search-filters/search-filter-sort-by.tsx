"use client";

import { type SortOrder, sortOrderEnum } from "@ucmp/sdk-search-api";
import { IconCaretDown } from "@ucmp/ui/icons";
import { useState } from "react";
import { Button } from "@/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu";

const SORT_LABEL: Record<SortOrder, string> = {
  [sortOrderEnum.Recommended]: "Recommended",
  [sortOrderEnum.LowestPrice]: "Lowest price",
  [sortOrderEnum.HighestPrice]: "Highest price",
  [sortOrderEnum.LowestMileage]: "Lowest mileage",
  [sortOrderEnum.NewestYear]: "Newest year",
};

const SORT_OPTIONS = Object.values(sortOrderEnum) as SortOrder[];

interface SearchFilterSortByProps {
  onSortChange?: (option: SortOrder) => void;
  /** Current sort value (e.g. from the URL query param). Controls the label when provided. */
  value?: SortOrder;
}

export function SearchFilterSortBy({ onSortChange, value }: SearchFilterSortByProps) {
  const [internalOption, setInternalOption] = useState<SortOrder>(sortOrderEnum.Recommended);
  // Controlled by `value` when provided, otherwise falls back to internal state.
  const selectedOption = value ?? internalOption;

  const handleSortChange = (option: SortOrder) => {
    // No-op when re-selecting the active option — avoids a duplicate sort activity.
    if (option === selectedOption) {
      return;
    }
    setInternalOption(option);
    onSortChange?.(option);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button className="min-w-42" size="lg" trailingIcon={IconCaretDown} variant="secondary">
            {SORT_LABEL[selectedOption]}
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {SORT_OPTIONS.map((option) => (
            <DropdownMenuItem key={option} onClick={() => handleSortChange(option)} role="menuitem">
              {SORT_LABEL[option]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
