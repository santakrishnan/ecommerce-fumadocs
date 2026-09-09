// @vitest-environment node
import { describe, expect, it } from "vitest";
import { AGENT_INVENTORY_STREAM_FIXTURE } from "../../__fixtures__/agent.fixture";
import { mapAgentUpstreamEvent } from "../agent.mapper";

describe("mapAgentUpstreamEvent", () => {
  it("valid event → returns typed AgentSearchEvent", () => {
    const event = AGENT_INVENTORY_STREAM_FIXTURE[0]; // Status event
    const result = mapAgentUpstreamEvent(event);
    expect(result).toEqual(event);
  });

  it("invalid input → returns null", () => {
    expect(mapAgentUpstreamEvent({ type: "Unknown", garbage: true })).toBeNull();
    expect(mapAgentUpstreamEvent(null)).toBeNull();
    expect(mapAgentUpstreamEvent("not an object")).toBeNull();
  });
});
