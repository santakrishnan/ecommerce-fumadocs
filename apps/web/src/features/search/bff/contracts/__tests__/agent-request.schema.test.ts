// @vitest-environment node
import { describe, expect, it } from "vitest";
import { AgentSearchRequestSchema } from "../agent-request.schema";

describe("AgentSearchRequestSchema — agentVersion", () => {
  it("is optional — a request without it still parses", () => {
    const result = AgentSearchRequestSchema.safeParse({ query: "trucks" });

    expect(result.success).toBe(true);
    expect(result.data?.agentVersion).toBeUndefined();
  });

  it("accepts 'v1'", () => {
    const result = AgentSearchRequestSchema.safeParse({ query: "trucks", agentVersion: "v1" });

    expect(result.success).toBe(true);
    expect(result.data?.agentVersion).toBe("v1");
  });

  it("accepts 'v2'", () => {
    const result = AgentSearchRequestSchema.safeParse({ query: "trucks", agentVersion: "v2" });

    expect(result.success).toBe(true);
    expect(result.data?.agentVersion).toBe("v2");
  });

  it("accepts 'v3' — an app-local override ahead of the SDK enum", () => {
    const result = AgentSearchRequestSchema.safeParse({ query: "trucks", agentVersion: "v3" });

    expect(result.success).toBe(true);
    expect(result.data?.agentVersion).toBe("v3");
  });

  it("rejects an unknown version string", () => {
    const result = AgentSearchRequestSchema.safeParse({ query: "trucks", agentVersion: "v99" });

    expect(result.success).toBe(false);
  });
});
