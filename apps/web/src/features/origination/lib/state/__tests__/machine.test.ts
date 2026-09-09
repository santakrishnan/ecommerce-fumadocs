import { describe, expect, test } from "vitest";
import { createActor, waitFor } from "xstate";
import { defineState } from "../define-state";
import { go, loadComplete, setSubmitError } from "../event-creators";
import { buildMachine } from "../machine";
import type { MachineInput } from "../types";

type EntryConfig = Parameters<typeof defineState<readonly ["done"]>>[0];

// Local test machine, decoupled from the real sample/sample-2 flow's own schemas.
// Named "sample" because buildMachine hardcodes that as the initial state (see its own TODO).
function testMachine(overrides: Pick<EntryConfig, "onEnter" | "onSubmit"> = {}) {
  const entry = defineState({
    key: "sample",
    transitions: ["done"],
    onEnter: overrides.onEnter,
    onSubmit: overrides.onSubmit,
    blocks: [],
  });
  const done = defineState({ key: "done", transitions: [], final: true, blocks: [] });

  return buildMachine([entry, done]);
}

function start(machine: ReturnType<typeof buildMachine>, input: Partial<MachineInput> = {}) {
  const actor = createActor(machine, { input: { id: "flow-1", url: "/entry", ...input } });
  actor.start();
  return actor;
}

describe("final state", () => {
  test("compiles to xstate's final type and stops the actor once reached", async () => {
    const machine = testMachine({
      onSubmit: async () => go("done"),
    });
    const actor = start(machine);
    actor.send({ type: "SUBMIT", payload: { formData: {} } });

    await waitFor(actor, (snapshot) => snapshot.matches("done"));

    expect(actor.getSnapshot().status).toBe("done");
  });
});

describe("onEnter", () => {
  test("starts in loading, then moves to active and overwrites ctx.data (not merged) once onEnter resolves", async () => {
    const machine = testMachine({
      onEnter: async () => loadComplete({ fresh: true }),
    });
    const actor = start(machine, { data: { stale: true } });

    expect(actor.getSnapshot().value).toEqual({ sample: "loading" });

    await waitFor(actor, (snapshot) => snapshot.matches({ sample: "active" }));

    expect(actor.getSnapshot().context.data).toEqual({ fresh: true });
  });

  test("routes to load-error when onEnter rejects, RETRY_LOAD re-invokes it", async () => {
    let attempts = 0;
    const machine = testMachine({
      onEnter: async () => {
        attempts += 1;
        if (attempts === 1) {
          throw new Error("boom");
        }
        return loadComplete({ fresh: true });
      },
    });
    const actor = start(machine);

    await waitFor(actor, (snapshot) => snapshot.matches({ sample: "load-error" }));

    actor.send({ type: "RETRY_LOAD" });

    await waitFor(actor, (snapshot) => snapshot.matches({ sample: "active" }));

    expect(attempts).toBe(2);
    expect(actor.getSnapshot().context.data).toEqual({ fresh: true });
  });
});

describe("GO_<target> from active", () => {
  test("with output present, assigns it to context.data", async () => {
    const machine = testMachine({ onEnter: async () => loadComplete({}) });
    const actor = start(machine);
    await waitFor(actor, (snapshot) => snapshot.matches({ sample: "active" }));

    actor.send({ type: "GO_done", output: { handedOff: true } });

    expect(actor.getSnapshot().context.data).toEqual({ handedOff: true });
    expect(actor.getSnapshot().value).toBe("done");
  });

  test("with no output (submit: false button), leaves context.data untouched", async () => {
    const machine = testMachine({ onEnter: async () => loadComplete({ original: true }) });
    const actor = start(machine);
    await waitFor(actor, (snapshot) => snapshot.matches({ sample: "active" }));

    actor.send({ type: "GO_done" });

    expect(actor.getSnapshot().context.data).toEqual({ original: true });
  });
});

describe("SUBMIT", () => {
  test("onSubmit resolving with a GO_x event raises it, driving a real transition to the target with new data", async () => {
    const machine = testMachine({
      onSubmit: async () => go("done", { submitted: true }),
    });
    const actor = start(machine);

    actor.send({ type: "SUBMIT", payload: { formData: {} } });

    await waitFor(actor, (snapshot) => snapshot.matches("done"));

    expect(actor.getSnapshot().context.data).toEqual({ submitted: true });
  });

  test("onSubmit throwing lands back in active with a submit-typed context.error", async () => {
    const machine = testMachine({
      onSubmit: () => {
        throw new Error("thrown outside the descriptor's own try/catch");
      },
    });
    const actor = start(machine);

    actor.send({ type: "SUBMIT", payload: { formData: {} } });

    await waitFor(
      actor,
      (snapshot) => snapshot.matches({ sample: "active" }) && !!snapshot.context.error
    );

    expect(actor.getSnapshot().context.error).toMatchObject({ type: "submit" });
  });

  test("SUBMIT_ERROR from a resolved onSubmit value lands back in active with context.error set", async () => {
    const machine = testMachine({
      onSubmit: async () => setSubmitError("bad request"),
    });
    const actor = start(machine);

    actor.send({ type: "SUBMIT", payload: { formData: {} } });

    await waitFor(
      actor,
      (snapshot) => snapshot.matches({ sample: "active" }) && !!snapshot.context.error
    );

    expect(actor.getSnapshot().context.error).toEqual({ type: "submit", error: "bad request" });
  });
});

describe("default onSubmit (no onSubmit declared on the state)", () => {
  test("machine still builds and starts — submitting always exists, even with no onSubmit", async () => {
    const machine = testMachine();
    const actor = start(machine);

    expect(actor.getSnapshot().value).toEqual({ sample: "active" });
  });

  test("SUBMIT with a target goes there via the default go(target), same as a submit: false button", async () => {
    const machine = testMachine();
    const actor = start(machine);

    actor.send({ type: "SUBMIT", payload: { formData: {}, target: "done" } });

    await waitFor(actor, (snapshot) => snapshot.matches("done"));
  });

  test("SUBMIT with no target is a true no-op — no transition, no error, back to active", async () => {
    const machine = testMachine();
    const actor = start(machine);

    actor.send({ type: "SUBMIT", payload: { formData: {} } });

    await waitFor(actor, (snapshot) => snapshot.matches({ sample: "active" }));

    expect(actor.getSnapshot().context.error).toBeUndefined();
  });
});

describe("buildMachine", () => {
  test("prefixes each state's GO_<target> with the machine id, so transitions reach the right composed state", async () => {
    const machine = testMachine({ onEnter: async () => loadComplete({}) });
    const actor = start(machine);
    await waitFor(actor, (snapshot) => snapshot.matches({ sample: "active" }));

    actor.send({ type: "GO_done" });

    expect(actor.getSnapshot().value).toBe("done");
  });
});
