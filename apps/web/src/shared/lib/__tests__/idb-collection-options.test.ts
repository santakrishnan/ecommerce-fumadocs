import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
// Installs a fake IDB implementation on globalThis.
// Each test resets to a fresh IDBFactory instance in beforeEach.
import "fake-indexeddb/auto";
import { createCollection } from "@tanstack/react-db";
import { IDBFactory } from "fake-indexeddb";
import { type IdbRecord, idbCollectionOptions } from "../idb-collection/idb-collection-options";

// ─── Test schema ─────────────────────────────────────────────────────────────

const itemSchema = z.object({
  vin: z.string().min(1),
  name: z.string(),
});
type TestItem = z.infer<typeof itemSchema>;

const makeConfig = (overrides?: {
  ttl?: number;
  capacity?: number;
  getPartitionKey?: (item: TestItem) => string | undefined;
  storeName?: string;
}) => ({
  id: "test-collection",
  storeName: overrides?.storeName ?? "test-store",
  schema: itemSchema,
  getKey: (v: TestItem) => v.vin,
  ttl: overrides?.ttl,
  capacity: overrides?.capacity,
  getPartitionKey: overrides?.getPartitionKey,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Invokes the sync function and awaits markReady, returning inserted items. */
async function runSync(
  config: ReturnType<typeof idbCollectionOptions<TestItem>>
): Promise<TestItem[]> {
  const written: TestItem[] = [];
  await new Promise<void>((resolve) => {
    config.config.sync.sync({
      begin: vi.fn(),
      write: (msg: Record<string, unknown>) => {
        if (msg.type === "insert") {
          written.push(msg.value as TestItem);
        }
      },
      commit: vi.fn(),
      markReady: resolve,
    });
  });
  return written;
}

/** Simulates an onInsert call with a single mutation. */
async function runInsert(
  config: ReturnType<typeof idbCollectionOptions<TestItem>>,
  item: TestItem
) {
  return config.config.onInsert({
    transaction: { mutations: [{ modified: item, key: item.vin }] },
  });
}

/** Simulates an onDelete call with given keys. */
async function runDelete(
  config: ReturnType<typeof idbCollectionOptions<TestItem>>,
  keys: string[]
) {
  return config.config.onDelete({
    transaction: { mutations: keys.map((key) => ({ key })) },
  });
}

/** Simulates an onUpdate call with a single mutation. */
async function runUpdate(
  config: ReturnType<typeof idbCollectionOptions<TestItem>>,
  item: TestItem
) {
  return config.config.onUpdate({
    transaction: { mutations: [{ modified: item, key: item.vin }] },
  });
}

/**
 * Directly writes a raw IDB record, bypassing the adapter.
 * Used to set up stale or invalid records for TTL/validation tests.
 */
async function writeRawRecord(
  storeName: string,
  record: Omit<IdbRecord<unknown>, never>
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = globalThis.indexedDB.open(`tdb-${storeName}`, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, { keyPath: "key" });
        store.createIndex("partitionKey", "partitionKey", { unique: false });
        store.createIndex("lastActivityAt", "lastActivityAt", { unique: false });
      }
    };
    req.onsuccess = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      const tx = db.transaction(storeName, "readwrite");
      const put = tx.objectStore(storeName).put(record);
      put.onsuccess = () => resolve();
      put.onerror = () => reject(put.error);
    };
    req.onerror = () => reject(req.error);
  });
}

// ─── Reset fake IDB before each test ─────────────────────────────────────────

// A fresh IDBFactory replaces globalThis.indexedDB each test, so no state
// bleeds between tests. The module-level dbCache is bypassed because the
// new IDBFactory gives each test a clean in-memory database.
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("idbCollectionOptions", () => {
  describe("sync function (initial load)", () => {
    it("returns empty array when store is empty", async () => {
      const cfg = idbCollectionOptions(makeConfig());
      const items = await runSync(cfg);
      expect(items).toEqual([]);
    });

    it("returns inserted record after insert + sync", async () => {
      const cfg = idbCollectionOptions(makeConfig());
      const item: TestItem = { vin: "1HGBH41JXMN109186", name: "Camry" };
      await runInsert(cfg, item);
      const items = await runSync(cfg);
      expect(items).toHaveLength(1);
      expect(items[0]).toEqual(item);
    });

    it("filters out records whose lastActivityAt exceeds TTL", async () => {
      const TTL = 5000;
      const cfg = idbCollectionOptions(makeConfig({ ttl: TTL }));
      const item: TestItem = { vin: "1HGBH41JXMN109186", name: "Old Car" };

      await writeRawRecord("test-store", {
        key: item.vin,
        entity: item,
        lastActivityAt: Date.now() - TTL - 1, // stale by 1ms
      });

      const items = await runSync(cfg);
      expect(items).toHaveLength(0);
    });

    it("excludes records that fail schema validation and emits console.warn", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(vi.fn());
      const cfg = idbCollectionOptions(makeConfig());

      await writeRawRecord("test-store", {
        key: "bad-key",
        entity: { not_a_valid_field: true }, // fails itemSchema
        lastActivityAt: Date.now(),
      });

      const items = await runSync(cfg);
      expect(items).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledWith(
        "[idbCollectionOptions] invalid record:",
        expect.objectContaining({ key: "bad-key" })
      );
      warnSpy.mockRestore();
    });
  });

  describe("onInsert", () => {
    it("writes a record and sync returns it", async () => {
      const cfg = idbCollectionOptions(makeConfig());
      const item: TestItem = { vin: "2T1BURHE8JC039175", name: "RAV4" };

      const result = await runInsert(cfg, item);
      expect(result).toEqual({ refetch: false });

      const items = await runSync(cfg);
      expect(items).toHaveLength(1);
      expect(items[0]).toEqual(item);
    });

    it("upserts on duplicate key — no double record (deduplication)", async () => {
      const cfg = idbCollectionOptions(makeConfig());
      const item: TestItem = { vin: "2T1BURHE8JC039175", name: "RAV4" };

      await runInsert(cfg, item);
      await runInsert(cfg, { ...item, name: "RAV4 Updated" });

      const items = await runSync(cfg);
      expect(items).toHaveLength(1);
      expect(items[0]?.name).toBe("RAV4 Updated");
    });

    it("evicts the oldest record when capacity is reached by a new entity", async () => {
      const cfg = idbCollectionOptions(makeConfig({ capacity: 2 }));

      const item1: TestItem = { vin: "1HGBH41JXMN109001", name: "Car 1" };
      const item2: TestItem = { vin: "1HGBH41JXMN109002", name: "Car 2" };
      const item3: TestItem = { vin: "1HGBH41JXMN109003", name: "Car 3" };

      await runInsert(cfg, item1);
      await new Promise((r) => setTimeout(r, 5));
      await runInsert(cfg, item2);
      await new Promise((r) => setTimeout(r, 5));
      await runInsert(cfg, item3);

      const items = await runSync(cfg);
      expect(items).toHaveLength(2);
      const vins = items.map((v) => v.vin);
      expect(vins).not.toContain(item1.vin); // oldest — evicted
      expect(vins).toContain(item2.vin);
      expect(vins).toContain(item3.vin);
    });

    it("does NOT evict when upserting an existing key", async () => {
      const cfg = idbCollectionOptions(makeConfig({ capacity: 2 }));

      const item1: TestItem = { vin: "1HGBH41JXMN109001", name: "Car 1" };
      const item2: TestItem = { vin: "1HGBH41JXMN109002", name: "Car 2" };

      await runInsert(cfg, item1);
      await runInsert(cfg, item2);
      await runInsert(cfg, { ...item1, name: "Car 1 Updated" }); // upsert, not new key

      const items = await runSync(cfg);
      expect(items).toHaveLength(2);
      const vins = items.map((v) => v.vin);
      expect(vins).toContain(item1.vin);
      expect(vins).toContain(item2.vin);
    });

    it("purges stale records before evaluating capacity", async () => {
      // Generous TTL: item1 is aged past it via an explicit wait below, while
      // item2 (written just before sync) must stay comfortably within it. A
      // tight TTL (e.g. 10ms) is flaky under CPU load — scheduling jitter
      // between item2's write and the sync-time purge can exceed it, causing
      // item2 to be purged as stale.
      const TTL = 1000;
      const cfg = idbCollectionOptions(makeConfig({ ttl: TTL, capacity: 1 }));

      const item1: TestItem = { vin: "1HGBH41JXMN109001", name: "Car 1" };
      const item2: TestItem = { vin: "1HGBH41JXMN109002", name: "Car 2" };

      await runInsert(cfg, item1);
      await new Promise((r) => setTimeout(r, TTL + 100)); // item1 is now stale

      // item1 stale → purged → capacity is 0 → no eviction → item2 inserted
      await runInsert(cfg, item2);

      const items = await runSync(cfg);
      expect(items).toHaveLength(1);
      expect(items[0]?.vin).toBe(item2.vin);
    });

    it("partitions records correctly — capacity is per partition", async () => {
      const cfg = idbCollectionOptions(
        makeConfig({
          capacity: 1,
          getPartitionKey: (item) => item.name,
        })
      );

      const itemA1: TestItem = { vin: "1HGBH41JXMN109001", name: "partition-a" };
      const itemB1: TestItem = { vin: "1HGBH41JXMN109002", name: "partition-b" };
      const itemA2: TestItem = { vin: "1HGBH41JXMN109003", name: "partition-a" };

      await runInsert(cfg, itemA1);
      await runInsert(cfg, itemB1);
      await runInsert(cfg, itemA2); // evicts itemA1 from partition-a only

      const items = await runSync(cfg);
      const vins = items.map((v) => v.vin);

      expect(vins).not.toContain(itemA1.vin);
      expect(vins).toContain(itemB1.vin);
      expect(vins).toContain(itemA2.vin);
    });
  });

  describe("onDelete", () => {
    it("removes the record from IDB", async () => {
      const cfg = idbCollectionOptions(makeConfig());
      const item: TestItem = { vin: "2T1BURHE8JC039175", name: "RAV4" };
      await runInsert(cfg, item);
      await runDelete(cfg, [item.vin]);
      const items = await runSync(cfg);
      expect(items).toHaveLength(0);
    });

    it("returns { refetch: false }", async () => {
      const cfg = idbCollectionOptions(makeConfig());
      const result = await runDelete(cfg, ["nonexistent"]);
      expect(result).toEqual({ refetch: false });
    });
  });

  describe("clearStore", () => {
    it("removes all records from the store", async () => {
      const cfg = idbCollectionOptions(makeConfig());
      await runInsert(cfg, { vin: "1HGBH41JXMN109001", name: "Car 1" });
      await runInsert(cfg, { vin: "1HGBH41JXMN109002", name: "Car 2" });
      await cfg.clearStore();
      const items = await runSync(cfg);
      expect(items).toHaveLength(0);
    });
  });

  describe("onUpdate", () => {
    it("updates an existing record and sync returns the new value", async () => {
      const cfg = idbCollectionOptions(makeConfig());
      const item: TestItem = { vin: "2T1BURHE8JC039175", name: "RAV4" };

      await runInsert(cfg, item);
      await runUpdate(cfg, { ...item, name: "RAV4 Updated" });

      const items = await runSync(cfg);
      expect(items).toHaveLength(1);
      expect(items[0]?.name).toBe("RAV4 Updated");
    });

    it("purges stale records after updating", async () => {
      const TTL = 10;
      const cfg = idbCollectionOptions(makeConfig({ ttl: TTL }));

      // Write a stale record directly so it sits in IDB past TTL
      await writeRawRecord("test-store", {
        key: "stale-vin",
        entity: { vin: "stale-vin", name: "Stale Car" },
        lastActivityAt: Date.now() - TTL - 1,
      });

      const live: TestItem = { vin: "2T1BURHE8JC039175", name: "Live Car" };
      await runInsert(cfg, live);
      await new Promise((r) => setTimeout(r, TTL + 10));

      // Update triggers purge — stale record should be gone
      await runUpdate(cfg, { ...live, name: "Live Car Updated" });

      const items = await runSync(cfg);
      expect(items).toHaveLength(1);
      expect(items[0]?.vin).toBe(live.vin);
    });

    it("returns { refetch: false }", async () => {
      const cfg = idbCollectionOptions(makeConfig());
      const item: TestItem = { vin: "2T1BURHE8JC039175", name: "RAV4" };
      await runInsert(cfg, item);
      const result = await runUpdate(cfg, { ...item, name: "Updated" });
      expect(result).toEqual({ refetch: false });
    });
  });

  describe("onDelete — purges stale on delete", () => {
    it("purges stale records after deleting", async () => {
      const TTL = 10;
      const cfg = idbCollectionOptions(makeConfig({ ttl: TTL }));

      const live: TestItem = { vin: "1HGBH41JXMN109001", name: "Live Car" };
      await runInsert(cfg, live);

      // Write a stale record directly
      await writeRawRecord("test-store", {
        key: "stale-vin",
        entity: { vin: "stale-vin", name: "Stale Car" },
        lastActivityAt: Date.now() - TTL - 1,
      });

      await new Promise((r) => setTimeout(r, TTL + 10));
      await runDelete(cfg, [live.vin]);

      // After delete+purge, both the deleted and the stale record are gone
      const items = await runSync(cfg);
      expect(items).toHaveLength(0);
    });
  });

  describe("eviction when capacity shrinks below current count", () => {
    it("evicts multiple surplus records when store holds more than capacity", async () => {
      const storeName = "surplus-store";
      const now = Date.now();

      // Seed 3 records via raw write (simulating a higher-capacity era)
      await writeRawRecord(storeName, {
        key: "v1",
        entity: { vin: "v1", name: "Car 1" },
        lastActivityAt: now - 30,
      });
      await writeRawRecord(storeName, {
        key: "v2",
        entity: { vin: "v2", name: "Car 2" },
        lastActivityAt: now - 20,
      });
      await writeRawRecord(storeName, {
        key: "v3",
        entity: { vin: "v3", name: "Car 3" },
        lastActivityAt: now - 10,
      });

      // Now insert with capacity=1 — eviction must remove 3 surplus records
      const cfg = idbCollectionOptions(makeConfig({ capacity: 1, storeName }));
      const item4: TestItem = { vin: "v4", name: "Car 4" };
      await runInsert(cfg, item4);

      const items = await runSync(cfg);
      expect(items).toHaveLength(1);
      expect(items[0]?.vin).toBe("v4");
    });
  });

  describe("idbUnsupported flag — short-circuits after IDB unavailable at sync", () => {
    it("skips IDB on insert when IDB was unavailable at sync time", async () => {
      const cfg = idbCollectionOptions(makeConfig({ storeName: "error-store" }));

      const saved = globalThis.indexedDB;
      globalThis.indexedDB = undefined as unknown as IDBFactory;

      // Run sync to trip idbUnsupportedRef = true
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(vi.fn());
      await runSync(cfg);
      warnSpy.mockRestore();

      globalThis.indexedDB = saved;

      const errorSpy = vi.spyOn(console, "error").mockImplementation(vi.fn());
      const result = await runInsert(cfg, { vin: "1HGBH41JXMN109001", name: "Car" });

      expect(result).toEqual({ refetch: false });
      expect(errorSpy).not.toHaveBeenCalled();

      errorSpy.mockRestore();
    });
  });

  describe("IDB unavailability fallback", () => {
    it("warns once and returns empty array from sync when IDB is undefined", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(vi.fn());

      const saved = globalThis.indexedDB;
      globalThis.indexedDB = undefined as unknown as IDBFactory;

      const cfg = idbCollectionOptions(makeConfig({ storeName: "fallback-store" }));
      const items = await runSync(cfg);

      expect(items).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("IndexedDB is not available"));

      globalThis.indexedDB = saved;
      warnSpy.mockRestore();
    });
  });

  describe("TanStack DB schema integration via createCollection", () => {
    it("rejects an invalid insert at the collection layer before our handler runs", () => {
      const { config } = idbCollectionOptions(makeConfig());
      const collection = createCollection(config);

      // Should throw SchemaValidationError — TanStack DB validates before onInsert fires
      expect(() =>
        collection.insert({ vin: "", name: "Bad VIN" } as unknown as TestItem)
      ).toThrow();
    });

    it("accepts a valid insert without throwing", () => {
      const { config } = idbCollectionOptions(makeConfig());
      const collection = createCollection(config);

      expect(() => collection.insert({ vin: "2T1BURHE8JC039175", name: "RAV4" })).not.toThrow();
    });

    it("valid insert is persisted to IDB and returned on sync", async () => {
      const { config } = idbCollectionOptions(makeConfig({ storeName: "integration-store" }));
      const collection = createCollection(config);

      const item: TestItem = { vin: "2T1BURHE8JC039175", name: "RAV4" };
      collection.insert(item);

      // Give the async IDB side effect time to complete
      await new Promise((r) => setTimeout(r, 20));

      // Fresh config against the same store — simulates a page reload
      const cfg2 = idbCollectionOptions(makeConfig({ storeName: "integration-store" }));
      const items = await runSync(cfg2);
      expect(items).toHaveLength(1);
      expect(items[0]).toEqual(item);
    });

    it("invalid insert does not reach IDB — store remains empty after failed insert", async () => {
      const { config } = idbCollectionOptions(makeConfig({ storeName: "invalid-store" }));
      const collection = createCollection(config);

      try {
        collection.insert({ vin: "", name: "Bad" } as unknown as TestItem);
      } catch {
        // expected
      }

      const cfg2 = idbCollectionOptions(makeConfig({ storeName: "invalid-store" }));
      const items = await runSync(cfg2);
      expect(items).toHaveLength(0);
    });
  });
});
