// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { PatchOriginationRequest } from "../../contracts/patch-origination-request.schema";
import { patchOriginationResponseSchema } from "../../contracts/patch-origination-response.schema";
import { mockPatchOrigination } from "../patch-origination-mock";

const ORIGINATION_ID = "22222222-2222-4222-8222-222222222222";

function request(overrides: Partial<PatchOriginationRequest> = {}): PatchOriginationRequest {
  return {
    originationId: ORIGINATION_ID,
    step: "entry",
    status: "completed",
    ...overrides,
  };
}

describe("mockPatchOrigination", () => {
  it("returns data conforming to patchOriginationResponseSchema", async () => {
    const result = await mockPatchOrigination(request());
    if (!result.success) {
      throw new Error("Expected success result");
    }
    expect(patchOriginationResponseSchema.safeParse(result.data).success).toBe(true);
  });

  it("echoes the patched step as currentStep and preserves the originationId", async () => {
    const result = await mockPatchOrigination(request({ step: "identity" }));
    if (!result.success) {
      throw new Error("Expected success result");
    }
    expect(result.data.currentStep).toBe("identity");
    expect(result.data.originationId).toBe(ORIGINATION_ID);
  });

  it("records a completed step in completedSteps", async () => {
    const result = await mockPatchOrigination(request({ step: "entry", status: "completed" }));
    if (!result.success) {
      throw new Error("Expected success result");
    }
    expect(result.data.completedSteps).toEqual(["entry"]);
  });

  it("records the patched step in the steps map with its status", async () => {
    const result = await mockPatchOrigination(request({ step: "identity", status: "started" }));
    if (!result.success) {
      throw new Error("Expected success result");
    }
    expect(result.data.steps.identity).toMatchObject({ status: "started" });
    expect(result.data.steps.identity?.updatedAt).toBeDefined();
  });

  it("leaves completedSteps empty for a non-completed transition", async () => {
    const result = await mockPatchOrigination(request({ step: "entry", status: "started" }));
    if (!result.success) {
      throw new Error("Expected success result");
    }
    expect(result.data.completedSteps).toEqual([]);
    expect(result.data.status).toBe("in-progress");
  });

  it("flips the lifecycle to completed when the final step completes", async () => {
    const result = await mockPatchOrigination(request({ step: "review", status: "completed" }));
    if (!result.success) {
      throw new Error("Expected success result");
    }
    expect(result.data.status).toBe("completed");
  });

  it("stays in-progress when the final step is only started", async () => {
    const result = await mockPatchOrigination(request({ step: "review", status: "started" }));
    if (!result.success) {
      throw new Error("Expected success result");
    }
    expect(result.data.status).toBe("in-progress");
  });
});
