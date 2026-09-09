import type { ComponentType } from "react";
import { SampleStateComponent } from "../../components/sample-state-component";
import { SampleTextFieldComponent } from "../../components/sample-text-field-component";

// Registry: componentId -> component. Block below is derived from this via typeof

// Marks "this field's value lives in context, resolve at render time",
// a mismatched context key is a plain TS error at the call site
export interface ContextRef<T = unknown> {
  __type?: T;
  $context: string;
}

// Builds a context reference for one field of a schema, keying the value type off the schema
// itself. Not called directly by state authors, defineState binds TDataSchema once and hands
// back a version already scoped to it, so state files just pass a key
export function fromContext<TDataSchema, K extends keyof TDataSchema & string>(
  key: K
): ContextRef<TDataSchema[K]> {
  return { $context: key };
}
export function isContextRef(v: unknown): v is ContextRef {
  return typeof v === "object" && v !== null && "$context" in v;
}

// Lets any field in `data` be given literally, or as a ContextRef to be
// resolved against machine context at render time.
type WithContextRefs<T> = { [K in keyof T]: T[K] | ContextRef<T[K]> };

// A component's own props minus `form`, which the renderer injects and
// is never part of authored block data.
// biome-ignore lint/suspicious/noExplicitAny: registry-entry constraint, mirrors tmp/state-data-driven-example.md §1
type DataProps<C extends ComponentType<any>> = Omit<React.ComponentProps<C>, "form">;

// biome-ignore lint/suspicious/noExplicitAny: registry-entry constraint, mirrors tmp/state-data-driven-example.md §1
function defineComponent<C extends ComponentType<any>>(component: C) {
  return { component };
}

// Type of the registry below — used to constrain Block's `componentId`.
export type ComponentRegistry = typeof componentRegistry;

// A state's block: which component to render + its data, typed against
// that componentId's real props. A typo'd field name or wrong type is a
// compile error at the state-descriptor call site.
export type Block<K extends keyof ComponentRegistry = keyof ComponentRegistry> = {
  [P in K]: { componentId: P; data: WithContextRefs<DataProps<ComponentRegistry[P]["component"]>> };
}[K];

/**********************
 * COMPONENT REGISTRY
 **********************/
export const componentRegistry = {
  sample: defineComponent(SampleStateComponent),
  "sample-text-field": defineComponent(SampleTextFieldComponent),
};
