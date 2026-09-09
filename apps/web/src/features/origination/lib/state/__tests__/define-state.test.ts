import { describe, expect, test, vi } from "vitest";
import { z } from "zod";
import type { CoreContext } from "../../state/types";
import { defineState } from "../define-state";
import { loadComplete } from "../event-creators";

const ctx: CoreContext = { id: "flow-1", url: "/sample" };
const FAILED_DATA_SCHEMA_MESSAGE = /failed its own dataSchema/;

describe("onEnter", () => {
  test("inner onEnter data validates and outer returns load complete", async () => {
    const state = defineState({
      key: "sample",
      transitions: [],
      dataSchema: z.object({ sampleText: z.string() }),
      onEnter: async () => loadComplete({ sampleText: "hello" }),
      blocks: [],
    });

    const result = await state.onEnter?.(ctx);

    expect(result).toEqual({ type: "LOAD_COMPLETE", data: { sampleText: "hello" } });
  });

  test("inner onEnter data fails validation and outer throws an error", async () => {
    const state = defineState({
      key: "sample",
      transitions: [],
      dataSchema: z.object({ sampleText: z.string() }),
      // Deliberately violates dataSchema's type to trigger the failure path
      onEnter: async () => loadComplete({ sampleText: 42 } as unknown as { sampleText: string }),
      blocks: [],
    });

    await expect(state.onEnter?.(ctx)).rejects.toThrow(FAILED_DATA_SCHEMA_MESSAGE);
  });

  test("with no dataSchema, onEnter's data passes through untouched", async () => {
    const state = defineState({
      key: "sample",
      transitions: [],
      onEnter: async () => loadComplete({ anything: "goes" }),
      blocks: [],
    });

    const result = await state.onEnter?.(ctx);

    expect(result).toEqual({ type: "LOAD_COMPLETE", data: { anything: "goes" } });
  });
});

describe("onSubmit", () => {
  test("form data validates and returns the output of inner onSubmit", async () => {
    const state = defineState({
      key: "sample",
      transitions: ["sample-2"],
      formSchema: z.object({ favoriteColor: z.string().min(1) }),
      onSubmit: async (formData) => ({ type: "GO_sample-2" as const, output: formData }),
      blocks: [],
    });

    const result = await state.onSubmit?.({ favoriteColor: "blue" }, {}, ctx, undefined);

    expect(result).toEqual({ type: "GO_sample-2", output: { favoriteColor: "blue" } });
  });

  test("form data fails validation and returns validation error without calling inner onSubmit", async () => {
    const inner = vi.fn();
    const state = defineState({
      key: "sample",
      transitions: ["sample-2"],
      formSchema: z.object({ favoriteColor: z.string().min(1, "Tell us your favorite color") }),
      onSubmit: inner,
      blocks: [],
    });

    const result = await state.onSubmit?.({ favoriteColor: "" }, {}, ctx, undefined);

    expect(result).toMatchObject({
      type: "SUBMIT_ERROR",
      error: {
        type: "validation",
        fieldErrors: { favoriteColor: ["Tell us your favorite color"] },
      },
    });
    expect(inner).not.toHaveBeenCalled();
  });

  test("form data validates and inner onSubmit throws error, outer returns submit error", async () => {
    const cause = new Error("upstream failed");
    const state = defineState({
      key: "sample",
      transitions: ["sample-2"],
      formSchema: z.object({ favoriteColor: z.string().min(1) }),
      onSubmit: async () => {
        throw cause;
      },
      blocks: [],
    });

    const result = await state.onSubmit?.({ favoriteColor: "blue" }, {}, ctx, undefined);

    expect(result).toEqual({ type: "SUBMIT_ERROR", error: { type: "submit", error: cause } });
  });

  test("with no formSchema, formData passes through to inner onSubmit untouched", async () => {
    const inner = vi.fn(async () => ({ type: "GO_sample-2" as const, output: undefined }));
    const state = defineState({
      key: "sample",
      transitions: ["sample-2"],
      onSubmit: inner,
      blocks: [],
    });

    await state.onSubmit?.({ anything: "goes" }, {}, ctx, undefined);

    expect(inner).toHaveBeenCalledWith({ anything: "goes" }, {}, ctx, undefined);
  });
});

describe("blocks", () => {
  test("callback form receives a fromContext scoped to the field name given", () => {
    const state = defineState({
      key: "sample",
      transitions: [],
      dataSchema: z.object({ sampleText: z.string() }),
      blocks: ({ fromContext }) => [
        { componentId: "sample", data: { text: fromContext("sampleText") } },
      ],
    });

    expect(state.blocks).toEqual([
      { componentId: "sample", data: { text: { $context: "sampleText" } } },
    ]);
  });

  test("plain array form passes through unchanged", () => {
    const state = defineState({
      key: "sample",
      transitions: [],
      blocks: [{ componentId: "sample", data: { text: "static" } }],
    });

    expect(state.blocks).toEqual([{ componentId: "sample", data: { text: "static" } }]);
  });
});
