"use client";

import type { ReactElement } from "react";
import type { Category } from "../types/categorized-modal";
import type { SearchAlias } from "../types/search-aliases";
import { CategorizedDetailModal } from "./categorized-detail-modal";

interface ViewAllSpecsModalProps {
  categories: Category[];
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  searchAliases?: SearchAlias[];
  trigger?: ReactElement;
}

export function ViewAllSpecsModal({
  categories,
  onOpenChange,
  open,
  searchAliases,
  trigger,
}: ViewAllSpecsModalProps) {
  return (
    <CategorizedDetailModal
      categories={categories}
      onOpenChange={onOpenChange}
      open={open}
      searchAliases={searchAliases}
      searchPlaceholder="Search"
      title="Specs"
      trigger={trigger}
    />
  );
}
