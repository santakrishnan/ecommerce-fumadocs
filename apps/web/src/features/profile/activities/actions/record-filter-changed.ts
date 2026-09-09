"use server";

import {
  type RecordFilterAddedInput,
  type RecordFilterRemovedInput,
  type RecordSmartFilterRemovedInput,
  recordFilterAddedInputSchema,
  recordFilterRemovedInputSchema,
  recordSmartFilterRemovedInputSchema,
} from "../bff/contracts/filter-change-input.schema";
import {
  recordFilterAdded,
  recordFilterRemoved,
  recordSmartFilterRemoved,
} from "../bff/use-cases/record-filter-changed";

/**
 * Server Actions (BFF boundary) for SRP filter tracking: the browser sends only
 * the filter-change payload; identity resolution and SDK event construction
 * happen in the use case. Fire-and-forget — resolve to void and never throw.
 *
 * Server Actions are public endpoints reachable outside the UI, so each input
 * is validated against its Zod schema before the use case runs. Invalid input
 * resolves silently (no throw) to preserve the fire-and-forget contract — a
 * tampered or malformed payload is simply never recorded.
 */
export async function recordFilterAddedAction(input: RecordFilterAddedInput): Promise<void> {
  const parsed = recordFilterAddedInputSchema.safeParse(input);
  if (!parsed.success) {
    return;
  }
  await recordFilterAdded(parsed.data);
}

export async function recordFilterRemovedAction(input: RecordFilterRemovedInput): Promise<void> {
  const parsed = recordFilterRemovedInputSchema.safeParse(input);
  if (!parsed.success) {
    return;
  }
  await recordFilterRemoved(parsed.data);
}

export async function recordSmartFilterRemovedAction(
  input: RecordSmartFilterRemovedInput
): Promise<void> {
  const parsed = recordSmartFilterRemovedInputSchema.safeParse(input);
  if (!parsed.success) {
    return;
  }
  await recordSmartFilterRemoved(parsed.data);
}
