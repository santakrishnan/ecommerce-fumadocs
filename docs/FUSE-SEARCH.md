# Fuzzy Search — `useFuseSearch`

Reusable fuzzy-search hook powered by [Fuse.js](https://www.fusejs.io/). Lives in `@ucmp/shared` and can be consumed by any app or feature in the monorepo.

## Import

```tsx
import { useFuseSearch } from "@ucmp/shared";
import type { UseFuseSearchOptions, UseFuseSearchResult } from "@ucmp/shared";
```

## API

```tsx
function useFuseSearch<T>(
  items: readonly T[],
  options: UseFuseSearchOptions<T>
): UseFuseSearchResult<T>;
```

### Parameters

| Param | Type | Description |
|-------|------|-------------|
| `items` | `readonly T[]` | The dataset to search. The Fuse index is rebuilt only when this reference changes. |
| `options` | `UseFuseSearchOptions<T>` | Configuration (see below). |

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `keys` | `string[]` or `{ name: string; weight: number }[]` | **required** | Fields on each item to index for matching. |
| `controlledQuery` | `string \| undefined` | `undefined` | When provided, the hook uses this value as the query and disables internal state. Use for components where the parent owns the input state. |
| `limit` | `number` | `20` | Max number of results returned. |
| `minQueryLength` | `number` | `2` | Minimum trimmed query length before a search is triggered. |
| `threshold` | `number` | `0.4` | Fuse.js threshold — `0` = exact match, `1` = match anything. `0.4` balances typo-tolerance with relevance. |
| `distance` | `number` | `100` | How far into the string to look for a match. |
| `minMatchCharLength` | `number` | `2` | Fuse.js minimum match char length — avoids noise from single-character queries. |
| `shouldSort` | `boolean` | `true` | Whether results are sorted by match score. |
| `...rest` | `IFuseOptions<T>` | — | Any other [Fuse.js options](https://www.fusejs.io/api/options.html) are passed through. |

### Return Value (`UseFuseSearchResult<T>`)

| Field | Type | Description |
|-------|------|-------------|
| `query` | `string` | Current search query (internal or controlled). |
| `setQuery` | `(q: string) => void` | Update the query (no-op in controlled mode). |
| `clearQuery` | `() => void` | Reset query to `""` (no-op in controlled mode). |
| `results` | `T[]` | Fuzzy-matched items for the current query. Empty when query is below `minQueryLength`. |
| `hasResults` | `boolean` | `results.length > 0` |
| `isSearching` | `boolean` | `true` when the trimmed query meets `minQueryLength`. |

## Usage Modes

### Uncontrolled (hook owns query state)

Use when the search input lives inside the same component and no external sync is needed.

```tsx
"use client";

import { useFuseSearch } from "@ucmp/shared";

interface Spec {
  label: string;
  value: string;
}

const specs: Spec[] = [
  { label: "Horsepower", value: "275 hp" },
  { label: "Torque", value: "310 lb-ft" },
  { label: "Adaptive Cruise Control", value: "Standard" },
];

function SpecSearch() {
  const { query, setQuery, results, clearQuery, isSearching, hasResults } =
    useFuseSearch(specs, {
      keys: ["label", "value"],
      limit: 10,
    });

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search specs..."
      />
      {query && <button onClick={clearQuery}>Clear</button>}

      {isSearching && !hasResults && <p>No results found</p>}

      <ul>
        {results.map((spec) => (
          <li key={spec.label}>
            {spec.label}: {spec.value}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Controlled (parent owns query state)

Use when multiple components need to share the same query (e.g., two instances of a search input — one in the header, one pinned to the footer).

```tsx
"use client";

import { useFuseSearch } from "@ucmp/shared";
import { useState } from "react";

function FeatureSearch({ features }: { features: { name: string }[] }) {
  const [query, setQuery] = useState("");

  const { results, hasResults, isSearching } = useFuseSearch(features, {
    keys: ["name"],
    controlledQuery: query,
    limit: 15,
  });

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search features..."
      />

      {isSearching && !hasResults && <p>No results found</p>}

      <ul>
        {results.map((f) => (
          <li key={f.name}>{f.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Existing Usage

### Search Filters Dialog

The filter modal's search tab uses `useFuseSearch` in **controlled mode** to show matching suggestion pills:

```
apps/web/src/features/search/components/filters-dialog/filter-search-input.tsx
```

```tsx
const { results: suggestions } = useFuseSearch(ALL_SUGGESTIONS, {
  keys: ["label"],
  limit: 6,
  controlledQuery: query, // parent owns query state
});
```

## Where Else to Use

| Use Case | Items | Keys | Mode |
|----------|-------|------|------|
| **VDP — View All Specs modal** | Spec rows `{ label, value, category }` | `["label", "value"]` | Uncontrolled |
| **VDP — View All Features modal** | Feature items `{ name, category }` | `["name"]` | Uncontrolled |
| **Inventory — filter by model/trim** | Vehicle list items | `["model", "trim", "year"]` | Controlled or Uncontrolled |
| **Landing — search recommendations** | Recommendation cards | `["title", "description"]` | Uncontrolled |
| **Any list/modal with 10+ items** | Any typed array | Any string fields | Either |

## Performance Notes

- The Fuse index is built **once** per `items` reference — not on every render or keystroke.
- React Compiler handles memoization automatically — no need for `useMemo`/`useCallback` wrappers.
- For very large datasets (1000+ items), consider debouncing the query with `useDebounce` from `@ucmp/shared`:

```tsx
import { useDebounce, useFuseSearch } from "@ucmp/shared";

const debouncedQuery = useDebounce(rawQuery, 200);
const { results } = useFuseSearch(largeDataset, {
  keys: ["name"],
  controlledQuery: debouncedQuery,
});
```

## Tuning Fuse.js

| Scenario | Threshold | Distance | Notes |
|----------|-----------|----------|-------|
| Strict matching (product codes) | `0.2` | `50` | Fewer false positives |
| Balanced (default) | `0.4` | `100` | Good for names, labels |
| Forgiving (natural language) | `0.6` | `200` | More typo tolerance, may surface noise |

## File Location

```
packages/shared/src/hooks/use-fuse-search.ts
```
