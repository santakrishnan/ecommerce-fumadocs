# Origination state machine

> **Status**: Active — engine + two sample states. UI orchestrator not yet built.

The origination flow (trade-in, auth, prequal, offer, etc) is a sequence of screens, and each
screen is a state in an XState machine. You never write XState config by hand for this flow —
you describe a screen once, as a `defineState()` call, and the engine compiles the full list of
screens into one machine for you. This doc walks through how that engine behaves once it's
running, then walks through what it takes to author a new screen on top of it.

## Table of contents

- [UI orchestrator (not yet built)](#ui-orchestrator-not-yet-built)
- [How the engine works](#how-the-engine-works)
- [Defining a state](#defining-a-state)
- [Where things live](#where-things-live)

---

## UI orchestrator (not yet built)

Nothing in this doc renders anything yet. A future story adds the orchestrator: the component
that looks at whichever state is active, reads its `blocks`, renders them through the component
registry, wires up `react-hook-form` against that state's `formSchema`, and turns button clicks
into `SUBMIT` or `GO_<target>` events back into the machine. Everything below is the engine and
the authoring layer that orchestrator will eventually sit on top of.

---

## How the engine works

### One shared context, one hand-off slot

Every flow shares one context shape across all its states: an id, a url, an optional error, and
a single `data` slot. That `data` slot is untyped at the engine level on purpose — each state
gives it meaning for as long as that state is active, then hands off exactly what it wants the
next state to see. Nothing here accumulates into a growing shape the way a big form object might,
and nothing is merged automatically between states. That replace-not-merge behavior comes up
again below, once there's a transition to look at.

### Entering a state: the loading phase

A state that declares an `onEnter` doesn't render right away. The machine sits in a `loading`
sub-state and invokes it first. If `onEnter` resolves, its output is checked against that state's
`dataSchema`, assigned onto context, and the machine moves into `active` — the sub-state where the
screen actually lives. If `onEnter` throws or rejects instead, the machine drops into `load-error`,
a dead end until something dispatches `RETRY_LOAD` and sends it back through `loading` to try
again. A state with no `onEnter` skips straight into `active`.

### Leaving a state: two paths out of `active`

From `active`, there are two ways to move on. Some actions are declared `submit: false` — these
fire a `GO_<target>` event directly, no form data and no `onSubmit` call, which is the right shape
for something like a skip link or a back button that shouldn't care whether the current form is
valid. Everything else goes through `SUBMIT`, which moves the machine into a `submitting`
sub-state and invokes `onSubmit`. From there, three outcomes are possible: `onSubmit` resolves
nothing and the machine falls back to `active` untouched (a deliberate no-op), it resolves a
`GO_<target>` event and that drives a real transition into the target state, or it resolves — or
throws — a submit error and the machine falls back to `active` with `context.error` set so the
screen can show it.

Put together, every non-final state compiles to the same four sub-states:

```
loading ──onDone──> active ──SUBMIT──> submitting ──onDone(GO_x)──> (next state)
   │                   ▲                    │
 onError               └──────onError───────┘
   ▼
load-error ──RETRY_LOAD──> loading
```

### Addressing between states

`buildMachine()` is what turns a plain list of state descriptors into this actual machine, all
nested under one hardcoded root id. That's why a state only ever needs to declare its own
transitions — when it lists `transitions: ["next-state"]`, the engine expands that into a
`GO_next-state` handler on its `active` and `submitting` sub-states, addressed against the whole
machine by that root id. You never wire up cross-state routing by hand; you just say where a
given state is allowed to go, and the engine handles the addressing.

The one shape that skips all of the above is a terminal state, declared with `final: true`. It has
no `loading`, `active`, or `submitting` — it compiles straight to XState's own final state type,
and reaching it stops the machine.

### Where the types go once a state is compiled

The last piece worth understanding before writing a state is what happens to its types along the
way. `defineState()` is where they're real — a state's `dataSchema`, `formSchema`, and the literal
set of strings in `transitions` are all inferred from what you pass in, which is what lets
`onSubmit`'s `target` parameter, `go()`'s first argument, and the `fromContext` helper your
`blocks` callback receives narrow to that state's own concrete types. A typo'd `fromContext` key,
or a `formSchema` that doesn't match what `onSubmit` expects, is a compile error right at that
call site.

Once compiled, though, the descriptor that comes out the other end has all of that erased back
down to `unknown`. `buildMachine` and `compileState` are shared infrastructure that operate on a
*list* of descriptors, and have no way to carry one state's specific schema types through to the
next — so they don't try. The type safety lives entirely in `defineState()`; the runtime
validation of actual values (`onEnter`'s resolved data, `onSubmit`'s form data) still happens on
every pass, driven by whichever schemas that state declared.

---

## Defining a state

A state file default-exports the result of a single `defineState(config)` call. This section
documents every field `config` accepts: which ones are required, what shape each one takes, and
how it affects the compiled state. A full working example follows at the end.

### `key` (required)

```ts
key: string
```

The state's id in the compiled machine. Other states reference it in their own `transitions`
arrays, and `go(key, ...)` calls target it by this value.

### `transitions` (required)

```ts
transitions: readonly string[]
```

The closed set of states this one is allowed to `go()` to. Declare it as a literal array (a
`const` assertion or inline tuple), not a widened `string[]` — that's what lets `go()`'s first
argument and `onSubmit`'s `target` parameter narrow to a real union instead of accepting any
string:

```ts
transitions: ["review", "confirmation"],
```

A terminal state (see `final` below) declares this as an empty array.

### `route` (optional)

```ts
route?: string
```

Copied onto the compiled state's `meta.route`. Not read by the engine itself — it exists for
whatever router the UI orchestrator ends up using.

### `dataSchema` (optional)

```ts
dataSchema?: StandardSchemaV1<unknown, TDataSchema>
```

A [Standard Schema](https://standardschema.dev) (Zod, Valibot, etc.) describing the shape of
`context.data` while this state is active. Two things read it:

- `onEnter`'s resolved output is validated against it before the state enters `active`.
- The `fromContext` helper passed into `blocks` is typed against its inferred output, so only
  keys this schema actually promises are valid to reference.

```ts
const dataSchema = z.object({ sampleText: z.string() });
```

Omit it for a state that doesn't care what shape `context.data` is in.

### `onEnter` (optional)

```ts
onEnter?: (ctx: CoreContext) => Promise<ReturnType<typeof loadComplete<DataOutput<TDataSchema>>>>
```

Runs once when the state is entered, before anything renders. Must resolve via the
`loadComplete(data)` helper from `event-creators.ts`:

```ts
onEnter: async (ctx) => {
  const data = await fetchSomething(ctx.id);
  return loadComplete(data);
},
```

The resolved `data` is validated against `dataSchema` immediately after `onEnter` returns. A
mismatch here is treated as a bug in `onEnter`, not bad user input — it throws and routes the
machine to `load-error` instead of producing a form-style error. Omit `onEnter` entirely for a
state that has nothing to load; it skips `loading` and opens straight into `active`.

### `formSchema` (optional)

```ts
formSchema?: StandardSchemaV1<TFormSchema>
```

A Standard Schema describing the shape of the form payload `onSubmit` expects. It's validated
before `onSubmit` runs — by the time your `onSubmit` body executes, `formData` is already the
parsed, typed output. A submission that fails this schema never reaches `onSubmit` at all; it's
converted into a validation error and the machine stays on `active`.

```ts
const formSchema = z.object({
  favoriteColor: z.string().min(1, "Tell us your favorite color"),
});
```

Omit it for a state with no form (e.g. one whose only actions are `submit: false`).

### `blocks` (required)

```ts
blocks: Block[] | ((helpers: { fromContext: <K>(key: K) => ContextRef }) => Block[])
```

Describes what the screen renders, without rendering anything itself. Each entry is a `{
componentId, data }` pair. `componentId` must be a key registered in
`component-registry.ts`'s `componentRegistry`; `data` is checked against that component's own
props, minus `form`. An unregistered id, or a `data` shape that doesn't match the component's
props, is a compile error at the block's own call site.

Use the plain array form when nothing needs to come from context:

```ts
blocks: [{ componentId: "sample-text-field", data: { name: "favoriteColor", label: "Favorite color" } }],
```

Use the callback form when a field's value should come from `context.data` instead of being
authored as a literal. `fromContext` is scoped to this state's own `dataSchema`, so only keys it
declares are valid to pass:

```ts
blocks: ({ fromContext }) => [
  { componentId: "sample", data: { text: fromContext("sampleText") } },
],
```

The value a `fromContext` reference resolves to is filled in by the orchestrator at render time,
against whatever `context.data` currently holds — it's not resolved inside `defineState` itself.

### `onSubmit` (optional)

```ts
onSubmit?: (
  formData: TFormSchema,
  additionalFormData: Record<string, unknown>,
  ctx: CoreContext & { data: TDataSchema },
  target: TTransitions[number] | undefined
) => Promise<StateEvent>
```

Runs when the state receives `SUBMIT`. Parameters:

- `formData` — the submitted form data, already validated against `formSchema`.
- `additionalFormData` — whatever the clicked action declared under its own
  `additionalFormData`, or `{}` if it declared none.
- `ctx` — the current context. `ctx.data` is typed against this state's `dataSchema` here, since
  `onEnter` already validated it on the way in.
- `target` — the clicked action's own `target`, if it declared one; otherwise `undefined`.

Resolve one of three ways:

```ts
// Move to another state, handing it new context.data
onSubmit: async (formData, _additionalFormData, ctx, target) =>
  go(target ?? "review", { ...ctx.data, ...formData }),

// Report a validation problem and stay on this state
onSubmit: async (formData) => {
  if (formData.favoriteColor === "beige") {
    return setValidationError([{ message: "Pick a better color", path: ["favoriteColor"] }]);
  }
  return go("review");
},

// Do nothing — no transition, no context change
onSubmit: async () => undefined,
```

Anything thrown inside `onSubmit` is caught automatically and converted to a submit error, so
you don't need your own try/catch just to report a failure. Omit `onSubmit` entirely and a
default is used: an action with a `target` behaves like a plain `go(target)`; one with no target
resolves to a no-op.

Whichever path you take, remember `go()`'s second argument **replaces** `context.data`, it does
not merge into it. Carry forward anything the current state doesn't want to lose by spreading it
explicitly, as in the first example above — drop the spread and the next state's `context.data`
is just `formData`, with everything else gone.

### `actions` (optional)

```ts
actions?: {
  label: string;
  variant?: "primary" | "tertiary";
  submit?: true;
  target?: TTransitions[number];
  additionalFormData?: Record<string, unknown>;
}[] | {
  label: string;
  variant?: "primary" | "tertiary";
  submit: false;
  target: TTransitions[number];
  additionalFormData?: Record<string, unknown>;
}[]
```

The buttons the screen renders. `submit: true` (the default — you can omit `submit` entirely)
routes the click through the full path above: validate `formSchema`, call `onSubmit`, let it
decide where to go. `submit: false` skips all of that — it requires a static `target` and
dispatches `GO_<target>` directly, with no form data and no `onSubmit` call:

```ts
actions: [
  { label: "Skip", submit: false, target: "review" },
  { label: "Next", variant: "primary", target: "review" },
],
```

Reach for `submit: false` for actions that should work no matter the current form's validity —
skip links, back buttons. Use the default for anything that should validate and hand data to
`onSubmit` first.

### `final` (optional)

```ts
final?: boolean
```

Marks the state terminal. It compiles straight to XState's own final state type: no `loading`,
`active`, or `submitting` sub-states, and `onEnter`/`onSubmit` are never invoked even if
declared. `transitions` should be an empty array. `blocks` and `dataSchema` still apply if the
terminal screen needs to render something out of whatever context it inherited on the way in.

### Putting it together

`sample.tsx`, in full:

```ts
import { z } from "zod";
import { defineState } from "../../lib/state/define-state";
import { go, loadComplete } from "../../lib/state/event-creators";

const dataSchema = z.object({
  sampleText: z.string(),
});

const formSchema = z.object({
  favoriteColor: z.string().min(1, "Tell us your favorite color"),
});

export default defineState({
  key: "sample",
  route: "/sample",
  transitions: ["sample-2"],
  dataSchema,
  formSchema,

  onEnter: async () => loadComplete({ sampleText: "This is sample text!" }),

  blocks: ({ fromContext }) => [
    { componentId: "sample", data: { text: fromContext("sampleText") } },
    { componentId: "sample-text-field", data: { name: "favoriteColor", label: "Favorite color" } },
  ],
  actions: [
    { label: "Skip", submit: false, target: "sample-2" },
    { label: "Next", variant: "primary", target: "sample-2" },
  ],

  // go's output replaces ctx.data rather than merging, so spread it forward
  onSubmit: async (_formData, _additionalFormData, ctx, target) =>
    go(target || "sample-2", {
      ...ctx.data,
      visitedSample: true,
    }),
});
```

Once written, the state still needs to be added to `data/state/index.ts`'s master list before
`buildMachine()` will include it in the compiled flow.

---

## Where things live

| Path | What's there |
|---|---|
| `lib/state/types.ts` | `CoreContext`, `MachineInput`, `StateError` — the engine-wide shapes |
| `lib/state/event-creators.ts` | `go`, `loadComplete`, `setSubmitError`, `setValidationError` — build the events `onEnter`/`onSubmit` resolve with |
| `lib/state/define-state.ts` | `defineState()` — the authoring API, validates schemas, erases types into a `StateDescriptor` |
| `lib/state/component-registry.ts` | `componentRegistry`, `Block`, `fromContext`'s low-level form — maps `componentId` to a real component and its props |
| `lib/state/machine.ts` | `buildMachine()`, `compileState()` — compiles a descriptor list into one XState machine |
| `data/state/*.tsx` | Actual states for this flow (`sample.tsx`, `sample-2.tsx` today) |
| `data/state/index.ts` | The master state list, wired into `buildMachine()` — add a new state here to include it in the flow |
| `components/*.tsx` | Components registered in `component-registry.ts` |
