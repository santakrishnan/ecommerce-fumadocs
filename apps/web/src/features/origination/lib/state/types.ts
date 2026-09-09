// Engine-level types. data is one opaque hand-off slot, overwritten on every transition,
// never accumulated, each state's own dataSchema gives it meaning

// The single machine-wide context, data carries whatever the previous state handed off via go()
export interface CoreContext {
  data?: unknown;
  error?: StateError;
  // Flow record id, e.g. patch(ctx.id, ...)
  id: string;
  // Machine's entry URL, read once by recover to pick the initial state
  url: string;
}

// Input the machine is created with, data seeds the initial context (e.g. resuming a session)
export interface MachineInput {
  data?: unknown;
  id: string;
  url: string;
}

// Field-addressable schema validation failure, built from StandardSchemaV1's own Issue shape
export interface ValidationError {
  fieldErrors: Record<string, string[]>;
  type: "validation";
}

// Whatever a state's onSubmit body itself threw, genuinely unknown
export interface SubmitError {
  error: unknown;
  type: "submit";
}

export type StateError = ValidationError | SubmitError;
