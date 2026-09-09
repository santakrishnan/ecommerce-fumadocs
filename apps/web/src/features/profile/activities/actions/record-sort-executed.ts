"use server";

import {
  type RecordSortExecutedInput,
  recordSortExecuted,
} from "../bff/use-cases/record-sort-executed";

/**
 * Server Action (BFF boundary) for SRP sort tracking: the browser sends only the
 * sort transition; identity resolution and SDK event construction happen in the
 * use case. Fire-and-forget — resolves to void and never throws.
 */
export async function recordSortExecutedAction(input: RecordSortExecutedInput): Promise<void> {
  await recordSortExecuted(input);
}
