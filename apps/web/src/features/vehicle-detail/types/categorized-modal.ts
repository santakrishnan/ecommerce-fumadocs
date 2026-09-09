/**
 * Shared types for the categorized detail modal (Specs & Features).
 */

import type { ReactElement } from "react";
import type { SearchAlias } from "./search-aliases";

export interface CategoryItem {
  label: string;
  /** Present for key-value rows (Specs), absent for label-only rows (Features). */
  value?: string;
}

export interface PackageItem {
  /** Optional footnote displayed below the item list. */
  footnote?: string;
  items: CategoryItem[];
  packageName: string;
}

export interface Category {
  id: string;
  items: CategoryItem[];
  title: string;
}

export interface Package {
  id: string;
  items: PackageItem[];
  title: string;
}

export interface CategorizedModalProps {
  /** Grouped data to display in the modal. */
  categories: Category[];
  /** Gap between list items. Defaults to 8 (32px). Use 6 (24px) for label-only lists. */
  itemGap?: "6" | "8";
  /** Callback when the modal open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Whether the modal is open. */
  open?: boolean;
  /** Optional packages to display in the modal. */
  packages?: Package;
  /** Optional search aliases/synonyms for flexible matching. */
  searchAliases?: SearchAlias[];
  /** Placeholder text for the search input. */
  searchPlaceholder?: string;
  /** Modal title displayed in the header. */
  title: string;
  /** Optional trigger element - renders via DialogTrigger render prop to avoid nested buttons. */
  trigger?: ReactElement;
}
