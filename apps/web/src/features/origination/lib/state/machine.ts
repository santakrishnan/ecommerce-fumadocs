import { assign, enqueueActions, fromPromise, raise, setup } from "xstate";
import type { StateDescriptor } from "./event-creators";
import type { CoreContext, MachineInput, StateError } from "./types";

// Builds a GO_<target> transition handler for each of a state's declared transitions
function goHandlers(transitions: readonly string[]) {
  return Object.fromEntries(
    transitions.map((t) => [
      `GO_${t}`,
      {
        target: `#origination.${t}`,
        // Only assign when output is present, a submit: false button dispatches GO_<target>
        // with none at all and should leave context.data untouched
        actions: enqueueActions(
          // biome-ignore lint/suspicious/noExplicitAny: xstate's event type here is derived from setup()'s actor typing, which this shared compiler can't tie to one specific descriptor's event shape.
          ({ enqueue, event }: any) => {
            if (event.output !== undefined) {
              enqueue.assign({ data: event.output });
            }
          }
        ),
      },
    ])
  );
}

// Compiles the per-state descriptors into one XState machine, context stays CoreContext
// uniformly since defineState erases each state's own type parameters first
export function buildMachine(descriptors: readonly StateDescriptor[]) {
  const states = Object.fromEntries(descriptors.map((d) => [d.key, compileState(d)]));
  return setup({
    types: {} as { context: CoreContext; input: MachineInput },
  }).createMachine({
    id: "origination",
    initial: "sample",
    context: ({ input }) => ({ id: input.id, url: input.url, data: input.data }),
    // biome-ignore lint/suspicious/noExplicitAny: compileState's return shape varies per descriptor (final vs not, onEnter/onSubmit presence), which widens to a union createMachine's StatesConfig conditional types can't structurally match.
    states: { ...states } as any, // TODO: Add explicit recovery state
  });
}

function compileState(d: StateDescriptor<unknown, unknown, string>) {
  // Terminal state, no phases, no submit/enter machinery
  if (d.final) {
    return { id: d.key, meta: { route: d.route }, type: "final" as const };
  }

  // Narrows to non-optional for the fromPromise callback below
  const onEnter = d.onEnter;

  return {
    id: d.key,
    meta: { route: d.route },
    initial: onEnter ? "loading" : "active",
    states: {
      ...(onEnter && {
        loading: {
          invoke: {
            src: fromPromise(({ input }: { input: { ctx: CoreContext } }) => onEnter(input.ctx)),
            input: ({ context }: { context: CoreContext }) => ({ ctx: context }),
            onDone: {
              target: "active",
              // Overwrites ctx.data, doesn't merge, this is the state's own validated shape now
              actions: assign(
                // biome-ignore lint/suspicious/noExplicitAny: xstate's onDone event type is derived from setup()'s actor typing, which this shared compiler can't tie to one specific descriptor's onEnter return shape.
                ({ event }: any) => ({ data: (event.output as { data: unknown }).data })
              ),
            },
            onError: { target: "load-error" },
          },
        },
        "load-error": { on: { RETRY_LOAD: { target: "loading", reenter: true } } },
      }),
      active: {
        on: {
          SUBMIT: { target: "submitting" },
          // submit: false buttons send go() directly, bypassing form submission
          ...goHandlers(d.transitions),
        },
      },
      submitting: {
        invoke: {
          src: fromPromise(
            ({
              input,
            }: {
              input: {
                formData: unknown;
                additionalFormData: Record<string, unknown>;
                ctx: CoreContext;
                target: string | undefined;
              };
            }) => d.onSubmit(input.formData, input.additionalFormData, input.ctx, input.target)
          ),
          input: ({
            event,
            context,
          }: {
            event: {
              payload: {
                formData: unknown;
                additionalFormData?: Record<string, unknown>;
                target?: string;
              };
            };
            context: CoreContext;
          }) => ({
            formData: event.payload.formData,
            additionalFormData: event.payload.additionalFormData ?? {},
            ctx: context,
            target: event.payload.target,
          }),
          onDone: [
            {
              // undefined output is onSubmit's deliberate no-op, raise() below can't dispatch it
              // biome-ignore lint/suspicious/noExplicitAny: xstate's onDone event type is derived from setup()'s actor typing, which this shared compiler can't tie to one specific descriptor's onSubmit return shape.
              guard: ({ event }: any) => event.output === undefined,
              target: "active",
            },
            {
              // biome-ignore lint/suspicious/noExplicitAny: raise()'s expression form needs the concrete event union to type-check, which this shared compiler can't know per-descriptor.
              actions: raise(({ event }: any) => event.output),
            },
          ],
          onError: {
            // Safety net, defineState's onSubmit wrapper already catches internally
            target: "active",
            actions: assign({
              error: ({ event }: { event: { error: unknown } }): StateError => ({
                type: "submit",
                error: event.error,
              }),
            }),
          },
        },
        on: {
          ...goHandlers(d.transitions),
          SUBMIT_ERROR: {
            target: "active",
            actions: assign({
              error: ({ event }: { event: { error: StateError } }) => event.error,
            }),
          },
        },
      },
    },
  };
}
