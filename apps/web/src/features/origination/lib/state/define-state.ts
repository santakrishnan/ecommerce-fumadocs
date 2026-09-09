import type { StandardSchemaV1 } from "~/types/standard-schema";
import { type Block, type ContextRef, fromContext } from "./component-registry";
import {
  type ActionButton,
  go,
  type loadComplete,
  type StateDescriptor,
  type StateEvent,
  setSubmitError,
  setValidationError,
} from "./event-creators";
import type { CoreContext } from "./types";

// No schema means nothing to validate, tuple-wrapped to stop the conditional distributing over TSchema's own union
type SchemaOutput<TSchema> = [TSchema] extends [StandardSchemaV1<unknown, infer Output>]
  ? Output
  : Record<string, never>;

// Same idea as SchemaOutput, but stays unknown with no schema instead of defaulting to {}
type DataOutput<TDataSchema> = [TDataSchema] extends [StandardSchemaV1<unknown, infer Output>]
  ? Output
  : unknown;

// What a state's blocks callback receives: a fromContext already scoped to its own dataSchema
interface StateHelpers<TDataSchema> {
  fromContext: <K extends keyof DataOutput<TDataSchema> & string>(
    key: K
  ) => ContextRef<DataOutput<TDataSchema>[K]>;
}

type SchemaParseResult<TSchema extends StandardSchemaV1 | undefined> =
  | { data: SchemaOutput<TSchema>; success: true }
  | { issues: readonly StandardSchemaV1.Issue[]; success: false };

async function parseSchema<TSchema extends StandardSchemaV1 | undefined>(
  schema: TSchema,
  input: unknown
): Promise<SchemaParseResult<TSchema>> {
  if (!schema) {
    return { success: true, data: input as SchemaOutput<TSchema> };
  }
  const result = await schema["~standard"].validate(input);
  if (result.issues) {
    return { success: false, issues: result.issues };
  }
  return { success: true, data: result.value as SchemaOutput<TSchema> };
}

// The author-facing config defineState takes, onSubmit receives already-validated formData
export interface StateConfig<
  TFormSchema extends StandardSchemaV1 | undefined,
  TTransitions extends readonly string[],
  TDataSchema extends StandardSchemaV1 | undefined = undefined,
> {
  actions?: ActionButton<TTransitions[number]>[];
  // Plain array if blocks don't reference ctx.data, callback form otherwise
  blocks: Block[] | ((helpers: StateHelpers<TDataSchema>) => Block[]);
  dataSchema?: TDataSchema;
  final?: boolean;
  formSchema?: TFormSchema;
  key: string;
  onEnter?: (ctx: CoreContext) => Promise<ReturnType<typeof loadComplete<DataOutput<TDataSchema>>>>;
  onSubmit?: (
    formData: SchemaOutput<TFormSchema>,
    additionalFormData: Record<string, unknown>, // comes from action buttons
    ctx: CoreContext & { data: DataOutput<TDataSchema> },
    target: TTransitions[number] | undefined
  ) => Promise<StateEvent<TTransitions[number]>>;
  route?: string;
  transitions: TTransitions;
}

// Builds a compiled StateDescriptor from a state's config, validates formData against formSchema
// before onSubmit, and onEnter's result against dataSchema before leaving the loading phase
export function defineState<
  const TTransitions extends readonly string[],
  TFormSchema extends StandardSchemaV1 | undefined = undefined,
  TDataSchema extends StandardSchemaV1 | undefined = undefined,
>(
  config: StateConfig<TFormSchema, TTransitions, TDataSchema>
): StateDescriptor<unknown, unknown, string> {
  const { blocks, dataSchema, formSchema, onEnter, onSubmit, ...rest } = config;

  const helpers: StateHelpers<TDataSchema> = {
    fromContext: (key) => fromContext<DataOutput<TDataSchema>, typeof key>(key),
  };

  return {
    ...rest,
    blocks: typeof blocks === "function" ? blocks(helpers) : blocks,
    dataSchema,
    formSchema,
    onEnter: onEnter
      ? async (ctx) => {
          const loaded = await onEnter(ctx);
          const parsed = await parseSchema(dataSchema, loaded.data);
          if (!parsed.success) {
            // Routes to load-error, same as a thrown/rejected onEnter
            throw new Error(
              `"${config.key}"'s onEnter resolved data that failed its own dataSchema: ${JSON.stringify(parsed.issues)}`
            );
          }
          return { data: parsed.data as DataOutput<TDataSchema>, type: "LOAD_COMPLETE" as const };
        }
      : undefined,
    onSubmit: onSubmit
      ? async (formData, additionalFormData, ctx, target) => {
          const parsed = await parseSchema(formSchema, formData);
          if (!parsed.success) {
            return setValidationError(parsed.issues);
          }
          try {
            // ctx.data is unknown on the compiled descriptor, but onEnter already validated it against dataSchema
            return await onSubmit(
              parsed.data,
              additionalFormData,
              ctx as CoreContext & { data: DataOutput<TDataSchema> },
              target
            );
          } catch (e) {
            return setSubmitError(e);
          }
        }
      : // No onSubmit declared, target can still be undefined for a submit: true action with none set
        async (_formData, _additionalFormData, _ctx, target) =>
          target === undefined ? undefined : go(target),
  };
}
