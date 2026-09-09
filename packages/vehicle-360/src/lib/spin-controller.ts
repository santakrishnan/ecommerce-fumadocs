import { spinPositionToFrameIndex, wrapSpinPosition } from "./spin-physics";

export interface SpinController {
  getPosition: () => number;
  release: () => void;
  setPosition: (position: number) => void;
}

export function createSpinController(
  frameCount: number,
  onFrameChange: (frameIndex: number) => void
): SpinController {
  let position = 0;
  let lastFrameIndex = spinPositionToFrameIndex(0, frameCount);

  const publish = (nextPosition: number) => {
    if (frameCount <= 0) {
      return;
    }

    const frameIndex = spinPositionToFrameIndex(nextPosition, frameCount);
    if (frameIndex !== lastFrameIndex) {
      lastFrameIndex = frameIndex;
      onFrameChange(frameIndex);
    }
  };

  return {
    getPosition: () => position,

    setPosition: (nextPosition: number) => {
      position = nextPosition;
      publish(position);
    },

    release: () => {
      const nearest = Math.round(position);
      position = wrapSpinPosition(nearest, frameCount);
      publish(position);
    },
  };
}
