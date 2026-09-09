export interface SearchResultsHeadlineProps {
  /** Optional trailing content (e.g. filter/sort buttons) aligned to the end of the headline row. */
  children?: React.ReactNode;
  /** Total number of results to display in the count line. */
  count: number;
  /** Contextual copy rendered as the main headline (e.g. "Highlander Hybrids" or
   *  "Highlander Hybrids with low mileage and top-rated features"). */
  headline: string;
}

export function SearchResultsHeadline({ count, headline, children }: SearchResultsHeadlineProps) {
  return (
    <div className="flex flex-col gap-4 pt-10 md:pt-10 lg:pt-8">
      <h4 className="subhead-sm text-text-secondary">All {count} results for</h4>
      <div className="flex w-full flex-col items-start gap-4 lg:flex-row lg:items-end lg:gap-4">
        <h1 className="h1 lg:max-w-xl">{headline}</h1>
        {children}
      </div>
    </div>
  );
}
