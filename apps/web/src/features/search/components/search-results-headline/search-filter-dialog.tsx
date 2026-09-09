"use client";

import { Button, Dialog, DialogTrigger } from "@ucmp/ui";
import { IconPreferences } from "@ucmp/ui/icons";
import { useParams } from "next/navigation";
import type { ActiveFilter } from "../../types/filters";
import { SearchFilterDialogContent } from "./search-filter-dialog-content";

export interface SearchFilterDialogProps {
  activeFilters: ActiveFilter[];
  onApplyFilters?: (filters: ActiveFilter[]) => void;
}

export function SearchFilterDialog({
  activeFilters = [],
  onApplyFilters,
}: SearchFilterDialogProps) {
  const params = useParams<{ id?: string }>();
  const searchId = params?.id;

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button size="lg" variant="secondary">
            <IconPreferences data-icon="inline-start" />
            Filters
            {activeFilters.length > 0 && (
              <span className="text-text-tertiary">{activeFilters.length}</span>
            )}
          </Button>
        }
      />
      <SearchFilterDialogContent
        activeFilters={activeFilters}
        onApplyFilters={onApplyFilters}
        searchId={searchId}
      />
    </Dialog>
  );
}
