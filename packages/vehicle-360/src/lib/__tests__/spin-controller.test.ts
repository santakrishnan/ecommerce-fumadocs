import { describe, expect, it, vi } from "vitest";
import { createSpinController } from "../spin-controller";

describe("createSpinController", () => {
  it("initialises with position 0", () => {
    const controller = createSpinController(36, vi.fn());
    expect(controller.getPosition()).toBe(0);
  });

  it("getPosition returns the last value passed to setPosition", () => {
    const controller = createSpinController(36, vi.fn());
    controller.setPosition(5.5);
    expect(controller.getPosition()).toBe(5.5);
  });

  it("setPosition fires onFrameChange when the rounded frame index changes", () => {
    const onFrameChange = vi.fn();
    const controller = createSpinController(36, onFrameChange);
    controller.setPosition(1.5); // Math.round(1.5) = 2 → frame 2
    expect(onFrameChange).toHaveBeenCalledWith(2);
  });

  it("setPosition does not fire onFrameChange when the frame index stays the same", () => {
    const onFrameChange = vi.fn();
    const controller = createSpinController(36, onFrameChange);
    controller.setPosition(0.1); // Math.round(0.1) = 0 → still frame 0
    expect(onFrameChange).not.toHaveBeenCalled();
  });

  it("setPosition fires onFrameChange only once per unique frame, not for every sub-frame move", () => {
    const onFrameChange = vi.fn();
    const controller = createSpinController(36, onFrameChange);
    controller.setPosition(0.4); // frame 0 — no change
    controller.setPosition(0.6); // frame 1 — change
    controller.setPosition(0.8); // frame 1 — no change
    expect(onFrameChange).toHaveBeenCalledTimes(1);
    expect(onFrameChange).toHaveBeenCalledWith(1);
  });

  it("release snaps position to the nearest whole frame", () => {
    const controller = createSpinController(36, vi.fn());
    controller.setPosition(3.7);
    controller.release();
    expect(controller.getPosition()).toBe(4);
  });

  it("release wraps position when it rounds to frameCount", () => {
    const onFrameChange = vi.fn();
    const controller = createSpinController(36, onFrameChange);
    controller.setPosition(35.7); // rounds to 36 → wraps to 0
    controller.release();
    expect(controller.getPosition()).toBe(0);
  });

  it("does nothing and never fires onFrameChange when frameCount is 0", () => {
    const onFrameChange = vi.fn();
    const controller = createSpinController(0, onFrameChange);
    controller.setPosition(5);
    controller.release();
    expect(onFrameChange).not.toHaveBeenCalled();
  });
});
