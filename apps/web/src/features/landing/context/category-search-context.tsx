"use client";

import type { ReactNode } from "react";
import { createContext, use, useCallback, useState } from "react";

interface CategorySearchContextValue {
  /** The pre-filled query to show in the search input. Empty string = no prefill. */
  defaultQuery: string;
  /** Whether the overlay should be open (triggered by a category card click). */
  isOpen: boolean;
  /** Opens the search overlay pre-filled with the given query. */
  openWithQuery: (query: string) => void;
  /** Resets the state (called by SearchOverlay after opening). */
  reset: () => void;
}

const CategorySearchContext = createContext<CategorySearchContextValue | null>(null);

export function CategorySearchProvider({ children }: { children: ReactNode }) {
  const [defaultQuery, setDefaultQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const openWithQuery = useCallback((query: string) => {
    setDefaultQuery(query);
    setIsOpen(true);
  }, []);

  const reset = useCallback(() => {
    setDefaultQuery("");
    setIsOpen(false);
  }, []);

  return (
    <CategorySearchContext value={{ defaultQuery, openWithQuery, isOpen, reset }}>
      {children}
    </CategorySearchContext>
  );
}

export function useCategorySearch() {
  return use(CategorySearchContext);
}
