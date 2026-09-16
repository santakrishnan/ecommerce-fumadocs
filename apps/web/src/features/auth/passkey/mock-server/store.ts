import "server-only";

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { PasskeyUser } from "../contract";

/**
 * THROWAWAY — delete with the rest of `mock-server/` once the upstream BED
 * passkey API is available on `/api/auth/passkey/*`.
 *
 * Mock store: a JSON file at `apps/web/.data/passkey-demo.json`
 * (gitignored). Fine locally, through ngrok, or on one VM; not on serverless
 * hosts — swap this module for a hosted database or Redis there.
 */

export interface StoredCredential {
  aaguid: string;
  /** Resolved from the AAGUID at registration; null when undisclosed. */
  authenticatorName: string | null;
  backedUp: boolean;
  counter: number;
  createdAt: string;
  deviceType: "singleDevice" | "multiDevice";
  id: string;
  lastUsedAt: string | null;
  /** User-set label, via PATCH /passkeys/:id. */
  nickname: string | null;
  /** "Safari on iPhone" etc., from the registering request's user agent. */
  platformLabel: string | null;
  /** COSE public key, base64url. There is no private key, ever. */
  publicKey: string;
  transports: string[];
  userId: string;
}

export interface StoredUser extends PasskeyUser {
  createdAt: string;
}

interface StoreData {
  credentials: Record<string, StoredCredential>;
  users: Record<string, StoredUser>;
}

const FILE = path.join(process.cwd(), ".data", "passkey-demo.json");
const EMPTY: StoreData = { users: {}, credentials: {} };

function read(): StoreData {
  try {
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as Partial<StoreData>;
    return { users: parsed.users ?? {}, credentials: parsed.credentials ?? {} };
  } catch {
    return structuredClone(EMPTY);
  }
}

function write(data: StoreData): void {
  mkdirSync(path.dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(data, null, 2));
}

export const store = {
  getUser(id: string): StoredUser | undefined {
    return read().users[id];
  },
  findUserByEmail(email: string): StoredUser | undefined {
    const wanted = email.trim().toLowerCase();
    return Object.values(read().users).find((u) => u.email.toLowerCase() === wanted);
  },
  saveUser(user: StoredUser): void {
    const data = read();
    data.users[user.id] = user;
    write(data);
  },
  credentialsForUser(userId: string): StoredCredential[] {
    return Object.values(read().credentials).filter((c) => c.userId === userId);
  },
  getCredential(id: string): StoredCredential | undefined {
    return read().credentials[id];
  },
  saveCredential(credential: StoredCredential): void {
    const data = read();
    data.credentials[credential.id] = credential;
    write(data);
  },
  deleteCredential(id: string): void {
    const data = read();
    delete data.credentials[id];
    write(data);
  },
  allUserIds(): string[] {
    return Object.keys(read().users);
  },
  reset(): void {
    write(structuredClone(EMPTY));
  },
};
