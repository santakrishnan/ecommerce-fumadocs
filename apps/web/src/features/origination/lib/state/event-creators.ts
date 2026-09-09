import type { StandardSchemaV1 } from "~/types/standard-schema";
import type { Block } from "./component-registry";
import type { CoreContext, SubmitError, ValidationError } from "./types";

/** Transitions to `target`, handing `output` to it as ctx.data, unvalidated here since the target's own dataSchema checks it on the way in */
export function go<const T extends string>(target: T, output?: unknown) {
  return { type: `GO_${target}` as const, output };
}

/** Reports schema validation failures, grouped by field, stays on the current state */
export function setValidationError(issues: readonly StandardSchemaV1.Issue[]) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issueFieldKey(issue);
    if (!fieldErrors[key]) {
      fieldErrors[key] = [];
    }
    fieldErrors[key].push(issue.message);
  }
  const error: ValidationError = { type: "validation", fieldErrors };
  return { type: "SUBMIT_ERROR" as const, error };
}

/** Reports an unexpected submit failure (e.g. a thrown error), stays on the current state */
export function setSubmitError(error: unknown) {
  const wrapped: SubmitError = { type: "submit", error };
  return { type: "SUBMIT_ERROR" as const, error: wrapped };
}

function issueFieldKey(issue: StandardSchemaV1.Issue): string {
  const segment = issue.path?.[0];
  if (segment === undefined) {
    return "_form";
  }
  const key = typeof segment === "object" ? segment.key : segment;
  return String(key);
}

/** Signals a state's onEnter resolved data for ctx.data, defineState still validates it against dataSchema */
export function loadComplete<TDataSchema = unknown>(data: TDataSchema) {
  return { type: "LOAD_COMPLETE" as const, data };
}

// Everything a state's onSubmit is allowed to resolve with, undefined is a deliberate
// no-op (no transition, no context change) for a submit: true action with no target
export type StateEvent<TTransitions extends string = string> =
  | { output?: unknown; type: `GO_${TTransitions}` }
  | ReturnType<typeof setSubmitError>
  | ReturnType<typeof setValidationError>
  | undefined;

// submit: false requires a static target and skips onSubmit entirely, submit: true (default)
// makes target optional and forwards it to onSubmit as the 4th argument
export type ActionButton<TTransitions extends string = string> =
  | {
      label: string;
      variant?: "primary" | "tertiary";
      submit?: true;
      target?: TTransitions;
      additionalFormData?: Record<string, unknown>;
    }
  | {
      label: string;
      variant?: "primary" | "tertiary";
      submit: false;
      target: TTransitions;
      additionalFormData?: Record<string, unknown>;
    };

// The compiled shape every state ends up as, state files don't write this by hand, see defineState
export interface StateDescriptor<
  TDataSchema = unknown,
  TFormSchema = unknown,
  TTransitions extends string = string,
> {
  actions?: ActionButton<TTransitions>[];
  blocks: Block[];
  dataSchema?: StandardSchemaV1<unknown, TDataSchema>;
  final?: boolean;
  formSchema?: StandardSchemaV1<TFormSchema>;
  key: string;
  onEnter?: (ctx: CoreContext) => Promise<ReturnType<typeof loadComplete<TDataSchema>>>;
  // Always present on the compiled descriptor, defineState defaults it so compileState never branches on it
  onSubmit: (
    formData: TFormSchema,
    additionalFormData: Record<string, unknown>, // always present — {} when no action declared one
    ctx: CoreContext,
    target: TTransitions | undefined // the clicked action's declared `target`, if it had one
  ) => Promise<StateEvent<TTransitions>>;
  route?: string;
  transitions: readonly TTransitions[];
}
