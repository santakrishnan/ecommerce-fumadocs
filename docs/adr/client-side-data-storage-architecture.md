# ADR: Client-Side Data Storage Architecture

---

## Context

Two categories of data need client-side persistence:

**Browsing history** — The "Continue Shopping" carousel requires recently viewed vehicles. This data is device-local. Server-persisting it adds privacy surface area and auth complexity for data that is only useful in the browser.

**Agent search sessions** — Conversation turns from the AI search agent must survive tab reloads and bookmark restores. Sessions are keyed by a URL-based search ID. Restoring history must not require a server round-trip or authentication.

Both categories are scoped to a visitor ID that flows from layout into context.

---

## Decision

Use **IndexedDB** as the persistence layer, managed through a custom **TanStack DB adapter** (`idbCollectionOptions`). All IDB access is encapsulated in `shared/lib/idb-collection/idb-collection-options.ts` — feature code never imports IDB APIs directly.

Collections are **visitor-scoped**. Each collection module exposes a factory keyed by `visitorId`. The partition key encodes visitor (and session, where applicable) isolation so TTL and capacity eviction never cross boundaries.

---

## Technology Choices

### IndexedDB over localStorage

- Limit: `localStorage` ≈ 5–10 MB; IDB scales to ~50% of available disk
- Async, non-blocking
- Stores structured objects without serialisation overhead
- Persists across browser restarts

IDB does not fire cross-tab events natively — cross-tab sync is out of scope.

### TanStack DB

Manages the in-memory reactive layer on top of the IDB adapter.

- `useLiveQuery` gives fine-grained subscriptions — only components whose query result changed re-render
- Query builder (`from`, `where`, `orderBy`) lets consumers create different views over the same collection without duplicating data
- Optimistic mutations: in-memory update is immediate; IDB write is a side effect
- Upgrade path: swapping the adapter config from `idbCollectionOptions` to `queryCollectionOptions` moves a collection to server-backed storage with no changes to hooks or components

### Zod validation

All data is validated on both the write path (before IDB) and the read path (on deserialisation). Invalid data on write is logged and dropped. Invalid data on read is discarded with a warning — handles schema evolution gracefully across app versions.

---

## Architecture

```
shared/lib/idb-collection/
  idb-collection-options.ts   ← sole IDB access point

features/landing/lib/
  vehicle-history-collection.ts  ← visitor-scoped factory

features/search/lib/
  agent-search-turns-collection.ts  ← visitor+session-scoped factory
```

Partition key design:

| Collection | Key | Partition key |
|---|---|---|
| Vehicle history | `v.id` (VIN) | `visitorId` |
| Agent search turns | `turn.id` | `${visitorId}.${turn.searchId}` |

### IDB operations and indexing

- `lastActivityAt` index: used for TTL purge (range query — only expired records loaded)
- `partitionKey` index: used for capacity eviction (only the target partition loaded)
- Purge runs on sync (before load), insert, update, and delete

### Graceful degradation

| Environment | Behaviour |
|---|---|
| SSR / server render | IDB not accessed; empty collection returned |
| `indexedDB` undefined | Same as SSR; no errors thrown |
| IDB quota exceeded | Error caught, logged once; in-memory state retained |
| Multiple tabs | Each tab is independent; cross-tab sync not implemented |
| Record fails Zod validation | Discarded on read (warn); rejected on write (error) |

---

## Known failure modes

All failures share the same property: **the IDB side effect fails silently; the in-memory TanStack DB state remains correct.** The user sees the write succeed, but it won't survive a reload.

| Scenario | Outcome |
|---|---|
| IDB write fails (quota, I/O error) | In-memory collection updated; IDB not persisted; error logged once |
| IDB quota exceeded by browser | Browser may evict IDB data for this origin at any time; next reload sees empty or partial state |
| Purge or eviction fails | Write already committed to IDB; stale/excess records may remain until the next successful operation cleans them up |
| Record written mid-eviction | Transient over-capacity state possible between upsert and evict; resolves within the same operation |
| `idbAvailable` flag set to `false` | All subsequent IDB operations are skipped for the session; in-memory-only until page reload |

No retry logic is implemented. These are all acceptable losses for ephemeral browsing data.

---

## Rejected alternatives

**`localStorage`** — Storage limit and synchronous API make it unsuitable for collections of vehicle records.

**`idbValueStore` (scalar value adapter)** — Built during the POC for zip code, fingerprint ID, and preferences. Removed: no current use case, and values that need to reach the server belong in cookies, not client-only IDB storage.

**Cross-tab sync via `BroadcastChannel`** — Attempted during POC. Abandoned due to React rendering constraints (a `null`-returning component is unmounted and therefore unsubscribed; incoming cross-tab updates have no subscriber). Revisit if user-facing demand arises.

---

## References

- [CLIENT-SIDE-COLLECTION-STORE.md](../CLIENT-SIDE-COLLECTION-STORE.md) — implementation guide
- [TanStack DB](https://tanstack.com/db/latest)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [useLiveQuery](https://tanstack.com/db/latest/docs/framework/react/overview)
