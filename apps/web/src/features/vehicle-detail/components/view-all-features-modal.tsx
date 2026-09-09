"use client";

import type { ReactElement } from "react";
import type { Category, Package } from "../types/categorized-modal";
import type { SearchAlias } from "../types/search-aliases";
import { CategorizedDetailModal } from "./categorized-detail-modal";

interface ViewAllFeaturesModalProps {
  categories: Category[];
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  packages?: Package;
  searchAliases?: SearchAlias[];
  trigger?: ReactElement;
}

export function ViewAllFeaturesModal({
  categories,
  packages,
  onOpenChange,
  open,
  searchAliases,
  trigger,
}: ViewAllFeaturesModalProps) {
  return (
    <CategorizedDetailModal
      categories={categories}
      itemGap="6"
      onOpenChange={onOpenChange}
      open={open}
      packages={packages}
      searchAliases={searchAliases}
      searchPlaceholder="What are you looking for?"
      title="Features"
      trigger={trigger}
    />
  );
}
