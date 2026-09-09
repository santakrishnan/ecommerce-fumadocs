import "server-only";

import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import type {
  DimensionId,
  FilterAddedActivity,
  FilterEntry,
  FilterRemovedActivity,
  SmartFilterRemovedActivity,
} from "@ucmp/sdk-visitor-profile-api";
import { visitorActivityTypeEnum } from "@ucmp/sdk-visitor-profile-api";
import type {
  FilterChangeEntry,
  RecordFilterAddedInput,
  RecordFilterRemovedInput,
  RecordSmartFilterRemovedInput,
} from "../contracts/filter-change-input.schema";
import { recordActivity } from "./activities";

export type {
  RecordFilterAddedInput,
  RecordFilterRemovedInput,
  RecordSmartFilterRemovedInput,
} from "../contracts/filter-change-input.schema";

/**
 * Translate a local `FilterChangeEntry` DTO into the generated SDK `FilterEntry`
 * contract. This is the single point where the visitor-profile SDK shape is
 * constructed — callers (search UI, Server Actions) only ever deal in the local
 * DTO, so SDK contract changes stay contained to this BFF boundary.
 */
function toSdkFilterEntry(entry: FilterChangeEntry): FilterEntry {
  return { ...entry, key: entry.key as DimensionId };
}

function toSdkFilterEntries(entries: FilterChangeEntry[]): FilterEntry[] {
  return entries.map(toSdkFilterEntry);
}

/**
 * Record a `visitorActivity.filter.added` activity for an SRP filter change.
 *
 * BFF-only. Fire-and-forget: never throws, never blocks. Silently skips when
 * `searchId` is missing or the visitor identity is unresolved (anonymous/cold
 * visit).
 */
export async function recordFilterAdded(input: RecordFilterAddedInput): Promise<void> {
  try {
    if (!input.searchId) {
      return;
    }

    const identity = await readVisitorIdentity();
    if (!(identity.visitorId && identity.sessionId)) {
      return;
    }

    const event: FilterAddedActivity = {
      type: visitorActivityTypeEnum["visitorActivity.filter.added"],
      visitorId: identity.visitorId,
      sessionId: identity.sessionId,
      searchId: input.searchId,
      filter: toSdkFilterEntry(input.filter),
      ...(input.filters ? { filters: toSdkFilterEntries(input.filters) } : {}),
    };

    await recordActivity(event);
  } catch {
    // Fire-and-forget: never let activity recording affect the caller.
  }
}

/**
 * Record a `visitorActivity.filter.removed` activity for an SRP filter change.
 *
 * BFF-only. Fire-and-forget: never throws, never blocks. Silently skips when
 * `searchId` is missing or the visitor identity is unresolved (anonymous/cold
 * visit).
 */
export async function recordFilterRemoved(input: RecordFilterRemovedInput): Promise<void> {
  try {
    if (!input.searchId) {
      return;
    }

    const identity = await readVisitorIdentity();
    if (!(identity.visitorId && identity.sessionId)) {
      return;
    }

    const event: FilterRemovedActivity = {
      type: visitorActivityTypeEnum["visitorActivity.filter.removed"],
      visitorId: identity.visitorId,
      sessionId: identity.sessionId,
      searchId: input.searchId,
      filter: toSdkFilterEntry(input.filter),
      ...(input.filters ? { filters: toSdkFilterEntries(input.filters) } : {}),
    };

    await recordActivity(event);
  } catch {
    // Fire-and-forget: never let activity recording affect the caller.
  }
}

/**
 * Record a `visitorActivity.smartFilter.removed` activity for an SRP smart
 * filter chip removal.
 *
 * BFF-only. Fire-and-forget: never throws, never blocks. Silently skips when
 * `searchId`/`name` is missing, `filters` is empty, or the visitor identity
 * is unresolved (anonymous/cold visit).
 */
export async function recordSmartFilterRemoved(
  input: RecordSmartFilterRemovedInput
): Promise<void> {
  try {
    if (!input.searchId) {
      return;
    }

    if (!input.name) {
      return;
    }

    if (!input.filters?.length) {
      return;
    }

    const identity = await readVisitorIdentity();
    if (!(identity.visitorId && identity.sessionId)) {
      return;
    }

    const event: SmartFilterRemovedActivity = {
      type: visitorActivityTypeEnum["visitorActivity.smartFilter.removed"],
      visitorId: identity.visitorId,
      sessionId: identity.sessionId,
      searchId: input.searchId,
      name: input.name,
      filters: toSdkFilterEntries(input.filters),
    };

    await recordActivity(event);
  } catch {
    // Fire-and-forget: never let activity recording affect the caller.
  }
}
