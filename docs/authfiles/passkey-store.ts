import "server-only";

import { env } from "@config/env";
import { decryptPayload, encryptPayload } from "@shared/lib/http/encryption";
import { buildCookieConfig } from "@shared/lib/http/sealed-cookie";
import * as jose from "jose";
import { cookies } from "next/headers";

/**
 * Key-value store for the passkey mocks (WebAuthn challenges, registered
 * public keys), with the backend chosen by `PASSKEY_STORE`:
 *
 * - `memory` (default): a Map in this server process. Local dev only — Vercel
 *   runs many short-lived instances, so the next request may not see it.
 * - `cookie`: an encrypted (AES-256-GCM JWE, `PASSKEY_STORE_KEY`), HttpOnly
 *   cookie per store. Works on Vercel without Redis; scoped to one browser.
 *   Writes need a Route Handler or Server Function (`cookies().set`).
 *
 * Entries expire after `ttlSeconds`; at most `maxEntries` are kept (oldest
 * dropped), and a cookie store also drops the oldest entries to stay under the
 * browser's ~4 KB cookie limit.
 */
export interface PasskeyStore<T> {
  delete(key: string): Promise<void>;
  get(key: string): Promise<T | undefined>;
  set(key: string, value: T): Promise<void>;
  /** All live entries, oldest first. */
  values(): Promise<T[]>;
}

export interface PasskeyStoreOptions {
  maxEntries: number;
  ttlSeconds: number;
}

interface Entry<T> {
  /** Expiry, epoch ms. */
  e: number;
  v: T;
}
type Entries<T> = Record<string, Entry<T>>;

/** Stay well under the 4096-byte per-cookie limit (name and attributes count too). */
const MAX_COOKIE_VALUE_BYTES = 3500;

// ─── Shared entry handling ──────────────────────────────────────────────────

function live<T>(entries: Entries<T>, now: number): Entries<T> {
  return Object.fromEntries(Object.entries(entries).filter(([, entry]) => entry.e > now));
}

/** Newest `max` entries (by expiry, which tracks insertion for a fixed TTL). */
function newest<T>(entries: Entries<T>, max: number): Entries<T> {
  return Object.fromEntries(
    Object.entries(entries)
      .sort(([, a], [, b]) => b.e - a.e)
      .slice(0, max)
  );
}

function oldestFirst<T>(entries: Entries<T>): T[] {
  return Object.values(entries)
    .sort((a, b) => a.e - b.e)
    .map((entry) => entry.v);
}

// ─── Memory backend ─────────────────────────────────────────────────────────

// On globalThis so `next dev` hot reloads keep in-flight ceremonies.
const MEMORY_KEY = Symbol.for("ucmp.auth.passkeyStore");
type GlobalWithStores = typeof globalThis & { [MEMORY_KEY]?: Map<string, Entries<unknown>> };

function memoryStores(): Map<string, Entries<unknown>> {
  const scope = globalThis as GlobalWithStores;
  scope[MEMORY_KEY] ??= new Map();
  return scope[MEMORY_KEY];
}

function memoryBackend<T>(name: string) {
  return {
    load: (): Promise<Entries<T>> =>
      Promise.resolve((memoryStores().get(name) ?? {}) as Entries<T>),
    save: (entries: Entries<T>): Promise<void> => {
      memoryStores().set(name, entries);
      return Promise.resolve();
    },
  };
}

// ─── Cookie backend ─────────────────────────────────────────────────────────

function cookieKey(): Uint8Array {
  const raw = env.PASSKEY_STORE_KEY;
  const key = raw ? jose.base64url.decode(raw) : null;
  if (key?.length !== 32) {
    throw new Error(
      "PASSKEY_STORE=cookie needs PASSKEY_STORE_KEY: a base64url AES-256 key (32 bytes)."
    );
  }
  return key;
}

function cookieBackend<T>(name: string, ttlSeconds: number) {
  const config = buildCookieConfig(`ucmp-pk-${name}`, ttlSeconds, {
    httpOnly: true,
    sameSite: "lax",
  });
  return {
    async load(): Promise<Entries<T>> {
      const raw = (await cookies()).get(config.name)?.value;
      if (!raw) {
        return {};
      }
      try {
        return await decryptPayload<Entries<T>>(raw, cookieKey());
      } catch {
        return {}; // tampered, foreign or rotated-key cookie: start empty
      }
    },
    async save(entries: Entries<T>): Promise<void> {
      const { name: cookieName, ...options } = config;
      const store = await cookies();
      let kept = entries;
      while (Object.keys(kept).length > 0) {
        const value = await encryptPayload(kept, cookieKey());
        if (value.length <= MAX_COOKIE_VALUE_BYTES) {
          store.set(cookieName, value, options);
          return;
        }
        kept = newest(kept, Object.keys(kept).length - 1);
      }
      store.set(cookieName, "", { ...options, maxAge: 0 });
    },
  };
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function createPasskeyStore<T>(name: string, options: PasskeyStoreOptions): PasskeyStore<T> {
  // Resolved per call, so tests (and env changes) can switch backends.
  const backend = () =>
    env.PASSKEY_STORE === "cookie"
      ? cookieBackend<T>(name, options.ttlSeconds)
      : memoryBackend<T>(name);

  const loadLive = async () => live(await backend().load(), Date.now());

  return {
    async get(key) {
      return (await loadLive())[key]?.v;
    },
    async set(key, value) {
      const entries = {
        ...(await loadLive()),
        [key]: { v: value, e: Date.now() + options.ttlSeconds * 1000 },
      };
      await backend().save(newest(entries, options.maxEntries));
    },
    async delete(key) {
      const { [key]: removed, ...rest } = await loadLive();
      if (removed) {
        await backend().save(rest);
      }
    },
    async values() {
      return oldestFirst(await loadLive());
    },
  };
}

/** Test-only: empty every memory store. */
export function __resetPasskeyStores(): void {
  memoryStores().clear();
}
