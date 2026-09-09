# Client-Side Collection Store: How to Use

How to create, consume, and extend client-side persistent collections using the `idbCollectionOptions` adapter.

---

## Background

Built on [TanStack DB](https://tanstack.com/db/latest) with a custom IndexedDB adapter. TanStack DB manages an in-memory reactive store; `idbCollectionOptions` makes it persistent. The rest of the app never touches `indexedDB` directly.

Active collections:

| Collection | Store name | Key | Partition key |
|---|---|---|---|
| `saved-vehicles` | `saved-vehicles` | `v.vin` | `visitorId` |
| `vehicle-history` | `vehicle-history` | `v.id` (VIN) | `visitorId` |
| `agent-search-turns` | `agent-search-turns` | `turn.id` | `${visitorId}.${turn.searchId}` |
| `bookmarked-vehicles` | `bookmarked-vehicles` | `v.vin` | `visitorId` |

All collections are visitor-scoped. The partition key ensures TTL and capacity eviction never cross visitor or session boundaries.

---

## Creating a collection

`idbCollectionOptions` returns `{ config, clearStore }`. Pass `config` to `createCollection`.

Collections are visitor-scoped — each feature module exposes a factory function that accepts `visitorId` and returns a stable module-level instance. The factory recreates the collection only when `visitorId` changes.

### Vehicle history — visitor-scoped flat list

```typescript
// shared/lib/vehicle-history/vehicle-history-collection.ts
import { type Collection, createCollection } from "@tanstack/react-db";
import { idbCollectionOptions } from "@shared/lib/client-only";
import { vehicleHistorySchema, type VehicleHistoryItem } from "./schemas";

const STUB_VISITOR_ID = "00000000-0000-0000-0000-000000000001"; // TODO: wire real context

type VehicleHistoryCollection = Collection<VehicleHistoryItem, string>;

let _current: {
  visitorId: string;
  collection: VehicleHistoryCollection;
  clearStore: () => Promise<void>;
} | null = null;

export function getVehicleHistoryCollection(visitorId = STUB_VISITOR_ID) {
  if (_current?.visitorId !== visitorId) {
    const { config, clearStore } = idbCollectionOptions({
      id: `vehicle-history.${visitorId}`,
      storeName: "vehicle-history",
      schema: vehicleHistorySchema,
      getKey: (v) => v.id,
      getPartitionKey: () => visitorId,
      ttl: 86_400_000,  // 24 hours
      capacity: 30,
    });
    _current = { visitorId, collection: createCollection(config) as VehicleHistoryCollection, clearStore };
  }
  return _current;
}
```

### Agent search turns — visitor + session partitioned

Turns have a two-level partition: visitor isolation at the outer level, session isolation at the inner level. Capacity of 50 turns is enforced per visitor+session.

```typescript
// features/search/lib/agent-search-turns-collection.ts
const { config, clearStore } = idbCollectionOptions({
  id: `agent-search-turns.${visitorId}`,
  storeName: "agent-search-turns",
  schema: agentSearchTurnSchema,
  getKey: (turn) => turn.id,
  getPartitionKey: (turn) => `${visitorId}.${turn.searchId}`,
  ttl: 86_400_000,
  capacity: 50,  // 50 turns per session
});
```

The adapter handles everything:

- On mount: purges stale records, reads IDB, calls `markReady()`
- On `insert`: validates with Zod, upserts to IDB, purges stale, evicts oldest if over capacity
- On `delete`: removes from IDB, purges stale
- If IDB unavailable (SSR, private browsing): warns once, degrades to in-memory only for the session

---

## Consuming a collection

Resolve `visitorId` once in a dedicated hook and return the collection. Consumers call that hook — no one deals with `visitorId` directly.

```typescript
// features/landing/hooks/use-vehicle-history-collection.ts
"use client";
import { useVisitorId } from "@shared/hooks/use-visitor-id";
import { getVehicleHistoryCollection } from "../lib/vehicle-history-collection";

export function useVehicleHistoryCollection() {
  const visitorId = useVisitorId();
  return getVehicleHistoryCollection(visitorId).collection;
}
```

Then build domain hooks on top:

```typescript
// features/landing/hooks/use-vehicle-history.ts
"use client";
import { useLiveQuery } from "@tanstack/react-db";
import { useVehicleHistoryCollection } from "./use-vehicle-history-collection";

export function useVehicleHistory() {
  const collection = useVehicleHistoryCollection();

  const { data: history = [], isLoading } = useLiveQuery(
    (q) => q.from({ v: collection }).orderBy(({ v }) => v.lastActivityAt, "desc"),
    []
  );

  function recordView(vehicle: unknown): void {
    const result = vehicleHistorySchema.safeParse(vehicle);
    if (!result.success) return;
    if (collection.has(result.data.id)) {
      collection.update(result.data.id, (draft: VehicleHistoryItem) => {
        Object.assign(draft, result.data);
      });
    } else {
      collection.insert(result.data);
    }
  }

  return { history, isLoading, recordView };
}
```

---

## Querying with different shapes

Call `useLiveQuery` directly against the collection from `useVehicleHistoryCollection()`. The collection hook is the only entry point needed.

```typescript
// Different sort
const collection = useVehicleHistoryCollection();
const { data: byPrice = [] } = useLiveQuery(
  (q) => q.from({ v: collection }).orderBy(({ v }) => v.price, "asc"),
  []
);

// Filtered
import { eq } from "@tanstack/react-db";
const { data: toyotas = [] } = useLiveQuery(
  (q) => q.from({ v: collection }).where(({ v }) => eq(v.make, "Toyota")),
  []
);

// Parameterised — include the variable in deps
function useHistoryByMake(make: string) {
  const collection = useVehicleHistoryCollection();
  return useLiveQuery(
    (q) => q.from({ v: collection }).where(({ v }) => eq(v.make, make)),
    [make]
  );
}
```

> Always include external variables in the dep array. A missing dep means the query won't re-run when the value changes.

---

## What not to do

Don't make the domain hook accept query options:

```typescript
// Don't do this — duplicates what the query builder already provides
useVehicleHistory({ orderBy: "price", filter: { make: "Toyota" } })
```

The hook owns the write path and default read. Anything beyond that is a direct `useLiveQuery` call.

---

## Upgrade path to server-backed storage

The only file that touches `indexedDB` is `shared/lib/idb-collection/idb-collection-options.ts`. To move a collection to server-synced storage, change one line in the factory:

```typescript
// Before: IDB-backed
const { config } = idbCollectionOptions({ ... });

// After: server-synced — hooks and components are unchanged
import { queryCollectionOptions } from "@tanstack/query-db-collection";
const config = queryCollectionOptions({
  queryKey: ["vehicle-history"],
  queryFn: () => fetch("/api/vehicle-history").then(r => r.json()),
  queryClient,
  getKey: (v) => v.id,
});
```

---

## Cross-tab synchronisation

Not currently implemented. Each tab loads from IDB independently on mount.

---

## Reference

| Topic | Location |
|---|---|
| `idbCollectionOptions` | `apps/web/src/shared/lib/idb-collection/idb-collection-options.ts` |
| `useVisitorId` | `apps/web/src/shared/hooks/use-visitor-id.ts` |
| Vehicle history collection | `apps/web/src/shared/lib/vehicle-history/vehicle-history-collection.ts` |
| Vehicle history hook | `apps/web/src/shared/hooks/use-vehicle-history-collection.ts` |
| Bookmarked vehicles collection | `apps/web/src/shared/lib/bookmarked-vehicles/bookmarked-vehicles-collection.ts` |
| Bookmarked vehicles hook | `apps/web/src/shared/hooks/use-bookmarked-vehicle.ts` |
| Watchlist API service | `apps/web/src/shared/services/watchlist-service.ts` |
| Agent turns collection | `apps/web/src/features/search/lib/agent-search-turns-collection.ts` |
| Feature spec | `.kiro/specs/client-side-browsing-history/` |
| TanStack DB | https://tanstack.com/db/latest |
