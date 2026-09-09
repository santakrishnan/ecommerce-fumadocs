import "server-only";

import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import { createLogger } from "@shared/lib/logger";
import {
  type SortExecutedActivity,
  type SortExecutedActivityNewSortEnumKey,
  type SortExecutedActivityPreviousSortEnumKey,
  sortExecutedActivityNewSortEnum,
  sortExecutedActivityPreviousSortEnum,
  visitorActivityTypeEnum,
} from "@ucmp/sdk-visitor-profile-api";
import { recordActivity } from "./activities";

const log = createLogger("record-sort-executed");

/**
 * Known sort values from the visitor profile SDK enums, so previous/new sort are
 * validated against the canonical contract rather than free-form strings.
 */
const NEW_SORT_VALUES = new Set<string>(Object.values(sortExecutedActivityNewSortEnum));
const PREVIOUS_SORT_VALUES = new Set<string>(Object.values(sortExecutedActivityPreviousSortEnum));

export interface RecordSortExecutedInput {
  /** Sort order selected by the visitor. */
  newSort: SortExecutedActivityNewSortEnumKey;
  /** Sort order active before the change, if any. */
  previousSort?: SortExecutedActivityPreviousSortEnumKey | null;
  /** The SRP search id (uuid) the sort was applied to. */
  searchId: string;
}

function toNewSort(value: string): SortExecutedActivityNewSortEnumKey | null {
  return NEW_SORT_VALUES.has(value) ? (value as SortExecutedActivityNewSortEnumKey) : null;
}

function toPreviousSort(
  value: string | null | undefined
): SortExecutedActivityPreviousSortEnumKey | undefined {
  if (!value) {
    return;
  }
  return PREVIOUS_SORT_VALUES.has(value)
    ? (value as SortExecutedActivityPreviousSortEnumKey)
    : undefined;
}

/**
 * Record a `visitorActivity.sort.executed` activity for an SRP sort change.
 *
 * BFF-only. Fire-and-forget: never throws, never blocks. Silently skips when
 * `searchId`/`newSort` is missing or unknown, the sort did not change, or the
 * visitor identity is unresolved (anonymous/cold visit).
 */
export async function recordSortExecuted(input: RecordSortExecutedInput): Promise<void> {
  try {
    if (!input.searchId) {
      log.debug("skip: missing searchId", { newSort: input.newSort });
      return;
    }

    const newSort = toNewSort(input.newSort);
    if (!newSort) {
      log.debug("skip: unknown newSort", {
        searchId: input.searchId,
        newSort: input.newSort,
      });
      return;
    }

    const previousSort = toPreviousSort(input.previousSort);

    // No-op sort change — skip duplicate record.
    if (previousSort === newSort) {
      log.debug("skip: no-op sort change", {
        searchId: input.searchId,
        newSort,
        previousSort,
      });
      return;
    }

    // Skip anonymous/cold visits.
    const identity = await readVisitorIdentity();
    if (!(identity.visitorId && identity.sessionId)) {
      log.debug("skip: unresolved visitor identity", {
        searchId: input.searchId,
        newSort,
        previousSort,
      });
      return;
    }

    const event: SortExecutedActivity = {
      type: visitorActivityTypeEnum["visitorActivity.sort.executed"],
      visitorId: identity.visitorId,
      sessionId: identity.sessionId,
      searchId: input.searchId,
      newSort,
      ...(previousSort ? { previousSort } : {}),
    };

    await recordActivity(event);

    log.debug("recorded sort-executed activity", {
      searchId: input.searchId,
      newSort,
      previousSort,
    });
  } catch (error) {
    // Fire-and-forget: never let activity recording affect the caller.
    log.warn("failed to record sort-executed activity", {
      searchId: input.searchId,
      newSort: input.newSort,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
