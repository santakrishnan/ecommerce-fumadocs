"use client";

import { devConsole } from "@shared/lib/dev-console";
import type { ZodType } from "zod";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Envelope stored in the IDB object store. */
export interface IdbRecord<T> {
  /** The stored entity payload. */
  entity: T;
  /** Primary key — value returned by getKey(entity). Used as IDB keyPath. */
  key: string;
  /** UTC wall-clock timestamp (ms) assigned at write time by the adapter. */
  lastActivityAt: number;
  /** Optional partition key for grouping records within a store. */
  partitionKey?: string;
}

/** Configuration object for idbCollectionOptions. */
export interface IdbCollectionConfig<T> {
  /**
   * Maximum number of non-stale records retained per partition (or globally
   * if no partition key is used). Default: 30.
   */
  capacity?: number;
  /** Extracts the unique string key from an entity. e.g. (v) => v.vin */
  getKey: (item: T) => string;
  /**
   * Optional — extracts the partition key from an entity.
   * TTL and capacity are enforced per partition when this is provided.
   * e.g. (turn) => turn.searchId
   */
  getPartitionKey?: (item: T) => string | undefined;
  /** Unique collection identifier (passed to createCollection). */
  id: string;
  /** Zod schema for T — validates mutations at the TanStack DB layer and entities on IDB read. */
  schema: ZodType<T>;
  /** IDB object store name — one store per entity type. */
  storeName: string;
  /**
   * Optional transform applied to each entity after schema validation during
   * the initial sync from IDB. Runs before the record is written into the
   * in-memory collection, so it executes exactly once at boot — never during
   * live mutations.
   *
   * Use this to normalise records that were persisted in a transient state.
   * Example: mark any "pending"/"streaming" turns as "aborted" on load.
   */
  transformOnLoad?: (entity: T) => T;
  /**
   * Record TTL in milliseconds. Records older than this are stale.
   * A record is stale when: Date.now() - lastActivityAt > ttl (strict greater-than).
   * Default: 10_800_000 (3 hours).
   */
  ttl?: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_TTL = 10_800_000; // 3 hours in ms
const DEFAULT_CAPACITY = 30;
const IDB_VERSION = 1;

// ─── IDB Store Singleton ─────────────────────────────────────────────────────

/** Cached IDB database promises keyed by storeName + IDB instance identity. */
const dbCache = new Map<string, { idb: IDBFactory; promise: Promise<IDBDatabase> }>();

/** Returns a cached promise for an open IDB database with the given store. */
function openIdbDatabase(storeName: string): Promise<IDBDatabase> {
  const idb = globalThis.indexedDB;
  const cached = dbCache.get(storeName);

  // Bust the cache if globalThis.indexedDB has been replaced (e.g. in tests)
  if (cached && cached.idb === idb) {
    return cached.promise;
  }

  const promise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = idb.open(`tdb-${storeName}`, IDB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, { keyPath: "key" });
        store.createIndex("partitionKey", "partitionKey", { unique: false });
        store.createIndex("lastActivityAt", "lastActivityAt", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  dbCache.set(storeName, { idb, promise });
  return promise;
}

/** Promisify a single IDBRequest. */
function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Open a transaction and return the object store. */
async function getStore(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
  const db = await openIdbDatabase(storeName);
  return db.transaction(storeName, mode).objectStore(storeName);
}

// ─── IDB Operations ───────────────────────────────────────────────────────────

async function readAllRecords<T>(storeName: string): Promise<IdbRecord<T>[]> {
  const store = await getStore(storeName, "readonly");
  return idbRequest<IdbRecord<T>[]>(store.getAll() as IDBRequest<IdbRecord<T>[]>);
}

/**
 * Wraps an IDBTransaction in a promise that resolves on `oncomplete` and
 * rejects on `onerror` or `onabort`. All work within the transaction must be
 * initiated before awaiting this — IDB auto-commits once the event loop is
 * idle with no pending requests.
 */
function txComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error("IDB transaction aborted"));
  });
}

/**
 * Strips Immer/proxy wrappers and any non-cloneable references from an entity
 * before handing it to IDB's structured clone algorithm.
 *
 * `mutation.modified` from TanStack DB is an Immer draft proxy — passing it
 * directly to `store.put()` throws "could not be cloned". A JSON round-trip
 * produces a plain object that structuredClone (and IDB) can handle.
 */
function toPlain<T>(entity: T): T {
  return JSON.parse(JSON.stringify(entity)) as T;
}

/**
 * Puts a record into an already-open object store (within a readwrite tx).
 * Does not open a new transaction — the caller owns the tx lifecycle.
 */
function putRecord<T>(store: IDBObjectStore, record: IdbRecord<T>): Promise<void> {
  return idbRequest(store.put(record)).then(() => undefined);
}

/**
 * Deletes all records matching keys within an already-open object store.
 * Does not open a new transaction — the caller owns the tx lifecycle.
 */
function deleteKeys(store: IDBObjectStore, keys: string[]): Promise<void> {
  if (keys.length === 0) {
    return Promise.resolve();
  }
  return Promise.all(keys.map((k) => idbRequest(store.delete(k)))).then(() => undefined);
}

async function clearAllRecords(storeName: string): Promise<void> {
  const db = await openIdbDatabase(storeName);
  const tx = db.transaction(storeName, "readwrite");
  await idbRequest(tx.objectStore(storeName).clear());
  await txComplete(tx);
}

// ─── TTL / Capacity Helpers (operate within a caller-owned tx) ───────────────

/**
 * Deletes all expired records using the `lastActivityAt` index.
 * Operates within the provided object store — no new transaction opened.
 * Stale boundary: lastActivityAt <= Date.now() - ttl (exclusive).
 */
function purgeStale(store: IDBObjectStore, ttl: number): Promise<void> {
  const cutoff = Date.now() - ttl;
  const range = IDBKeyRange.upperBound(cutoff, true); // exclusive upper bound

  return new Promise<void>((resolve, reject) => {
    const req = store.index("lastActivityAt").openCursor(range);
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) {
        resolve();
        return;
      }
      cursor.delete();
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Evicts the oldest records in the partition (or store) until count <= capacity.
 * Reads via the `partitionKey` index when provided, otherwise full store read.
 * Operates within the provided object store — no new transaction opened.
 */
function evictIfOverCapacity<T>(
  store: IDBObjectStore,
  capacity: number,
  partitionKey: string | undefined
): Promise<void> {
  const req =
    partitionKey === undefined
      ? store.getAll()
      : store.index("partitionKey").getAll(IDBKeyRange.only(partitionKey));

  return new Promise<void>((resolve, reject) => {
    req.onsuccess = () => {
      const records = req.result as IdbRecord<T>[];
      if (records.length <= capacity) {
        resolve();
        return;
      }
      records.sort((a, b) => a.lastActivityAt - b.lastActivityAt);
      const toEvict = records.slice(0, records.length - capacity);
      deleteKeys(
        store,
        toEvict.map((r) => r.key)
      ).then(resolve, reject);
    };
    req.onerror = () => reject(req.error);
  });
}

// ─── CollectionConfig builder ─────────────────────────────────────────────────

function buildCollectionConfig<T extends object>(
  config: IdbCollectionConfig<T>,
  idbUnsupportedRef: { value: boolean }
) {
  const ttl = config.ttl ?? DEFAULT_TTL;
  const capacity = config.capacity ?? DEFAULT_CAPACITY;
  const { storeName, schema, getKey, getPartitionKey, transformOnLoad } = config;

  return {
    id: config.id,
    schema,
    getKey,

    // ── Sync: initial load from IDB ───────────────────────────────────────
    sync: {
      // biome-ignore lint/suspicious/noExplicitAny: TanStack DB's sync params type is internal and version-specific
      sync: (params: any) => {
        const { begin, write, commit, markReady } = params;
        if (typeof globalThis.indexedDB === "undefined") {
          // IDB is not supported in this environment (SSR, private browsing,
          // storage policy). Warn once and degrade to in-memory only.
          devConsole.warn(
            "[idbCollectionOptions] IndexedDB is not available — collection will not be persisted."
          );
          idbUnsupportedRef.value = true;
          markReady();
          // biome-ignore lint/suspicious/noEmptyBlockStatements: no-op cleanup — IDB never opened
          return () => {};
        }

        // Purge expired records first so we never load or emit stale data.
        // Uses its own readwrite tx — sync runs once at boot before any
        // mutation handlers, so no tx contention risk here.
        openIdbDatabase(storeName)
          .then((db) => {
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            return purgeStale(store, ttl).then(() => txComplete(tx));
          })
          .then(() => readAllRecords<T>(storeName))
          .then((records) => {
            begin();
            for (const record of records) {
              const parsed = schema.safeParse(record.entity);
              if (!parsed.success) {
                devConsole.warn("[idbCollectionOptions] invalid record:", {
                  key: record.key,
                  zodErrors: parsed.error,
                });
                continue;
              }
              const entity = transformOnLoad ? transformOnLoad(parsed.data) : parsed.data;
              write({ type: "insert", value: entity });
            }
            commit();
            markReady();
          })
          .catch((error) => {
            devConsole.error("[idbCollectionOptions] sync failed:", error);
            markReady();
          });

        // biome-ignore lint/suspicious/noEmptyBlockStatements: no subscriptions needed — IDB-only, no cross-tab sync
        return () => {};
      },
    },

    // ── onInsert: persist to IDB ───────────────────────────────────────────
    onInsert: async ({
      transaction,
    }: {
      transaction: { mutations: Array<{ modified: T; key: string }> };
    }) => {
      if (idbUnsupportedRef.value) {
        return { refetch: false as const };
      }

      try {
        const db = await openIdbDatabase(storeName);
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);

        // Upsert all mutations in this transaction batch.
        // TanStack DB validated each item against the schema before calling us,
        // so mutation.modified is guaranteed to be a valid T.
        // Do NOT call collection.update() here — TanStack DB's optimistic layer
        // already updated in-memory state; re-entering causes a double write.
        const now = Date.now();
        for (const mutation of transaction.mutations) {
          const key = getKey(mutation.modified);
          const partitionKey = getPartitionKey?.(mutation.modified);
          await putRecord(store, {
            key,
            entity: toPlain(mutation.modified),
            lastActivityAt: now,
            partitionKey,
          });
        }

        await purgeStale(store, ttl);
        const lastMutation = transaction.mutations.at(-1);
        if (lastMutation) {
          const partitionKey = getPartitionKey?.(lastMutation.modified);
          await evictIfOverCapacity<T>(store, capacity, partitionKey);
        }

        await txComplete(tx);
      } catch (error) {
        // IDB errors here are assumed transient (quota, I/O blip, blocked tx).
        // We intentionally swallow and do NOT re-throw — throwing would cause
        // TanStack DB to roll back the optimistic state, removing the item from
        // the UI even though the in-memory mutation succeeded. The write will
        // be retried on the next mutation.
        devConsole.error("[idbCollectionOptions]", error);
      }

      return { refetch: false as const };
    },

    // ── onUpdate: persist to IDB ───────────────────────────────────────────
    onUpdate: async ({
      transaction,
    }: {
      transaction: { mutations: Array<{ modified: T; key: string }> };
    }) => {
      if (idbUnsupportedRef.value) {
        return { refetch: false as const };
      }

      try {
        const db = await openIdbDatabase(storeName);
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);

        const now = Date.now();
        for (const mutation of transaction.mutations) {
          const key = getKey(mutation.modified);
          const partitionKey = getPartitionKey?.(mutation.modified);
          await putRecord(store, {
            key,
            entity: toPlain(mutation.modified),
            lastActivityAt: now,
            partitionKey,
          });
        }

        await purgeStale(store, ttl);
        await txComplete(tx);
      } catch (error) {
        // See onInsert — intentionally swallowed to preserve optimistic state.
        devConsole.error("[idbCollectionOptions]", error);
      }

      return { refetch: false as const };
    },

    // ── onDelete: remove from IDB ──────────────────────────────────────────
    onDelete: async ({ transaction }: { transaction: { mutations: Array<{ key: string }> } }) => {
      if (idbUnsupportedRef.value) {
        return { refetch: false as const };
      }

      try {
        const db = await openIdbDatabase(storeName);
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);

        await deleteKeys(
          store,
          transaction.mutations.map((m) => m.key)
        );
        await purgeStale(store, ttl);
        await txComplete(tx);
      } catch (error) {
        // See onInsert — intentionally swallowed to preserve optimistic state.
        devConsole.error("[idbCollectionOptions]", error);
      }

      return { refetch: false as const };
    },
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Creates a TanStack DB CollectionConfig backed by IndexedDB.
 *
 * This is the only file in the codebase that directly interacts with
 * `window.indexedDB`. All collections above this layer use the standard
 * TanStack DB collection interface.
 *
 * Returns `{ config, clearStore }`:
 * - Pass `config` to `createCollection()`.
 * - Call `clearStore()` to wipe the IDB object store (logout, dev tools, etc.).
 *
 * Graceful degradation:
 * - IDB unavailable (SSR, security policy) → warns once, in-memory only for the session.
 *
 * Upgrade path: replace `idbCollectionOptions(c).config` with
 * `queryCollectionOptions(serverConfig)` to switch to server-synced storage
 * without touching hooks or components.
 */
export function idbCollectionOptions<T extends object>(config: IdbCollectionConfig<T>) {
  const idbUnsupportedRef = { value: false };
  const collectionConfig = buildCollectionConfig(config, idbUnsupportedRef);

  async function clearStore(): Promise<void> {
    if (idbUnsupportedRef.value) {
      return;
    }
    try {
      await clearAllRecords(config.storeName);
    } catch (error) {
      devConsole.error("[idbCollectionOptions]", error);
    }
  }

  return { config: collectionConfig, clearStore };
}
