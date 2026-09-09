// @vitest-environment node
import { describe, expect, it } from "vitest";
import { DEFAULT_AGENT_BACKEND, resolveAgentVersion } from "../agent-backend";

describe("resolveAgentVersion", () => {
  it("maps 'v1' to 'v1'", () => {
    expect(resolveAgentVersion("v1")).toBe("v1");
  });

  it("maps 'v2' to 'v2'", () => {
    expect(resolveAgentVersion("v2")).toBe("v2");
  });

  it("maps 'v3' to 'v3' — an app-local override ahead of the SDK enum", () => {
    expect(resolveAgentVersion("v3")).toBe("v3");
  });

  it("maps 'static_mock' to the DEFAULT_AGENT_BACKEND version", () => {
    expect(resolveAgentVersion("static_mock")).toBe(DEFAULT_AGENT_BACKEND);
  });

  it("maps an unrecognized backend string to the DEFAULT_AGENT_BACKEND version", () => {
    expect(resolveAgentVersion("bogus")).toBe(DEFAULT_AGENT_BACKEND);
  });
});
