import { buildMachine } from "../../lib/state/machine";
import sampleState from "./sample";
import sampleState2 from "./sample-2";

// Master descriptor list — every state the origination flow can be in.
const states = [sampleState, sampleState2];

// Built once here, not in lib/state/machine.ts — buildMachine is generic
// compiler infra and shouldn't know about this flow's concrete states.
export const originationMachine = buildMachine(states);
