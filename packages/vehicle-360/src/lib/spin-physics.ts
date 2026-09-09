export const DEFAULT_PIXELS_PER_FRAME = 5;

export function wrapSpinPosition(value: number, frameCount: number): number {
  if (frameCount <= 0) {
    return 0;
  }

  let wrapped = value % frameCount;
  if (wrapped < 0) {
    wrapped += frameCount;
  }
  return wrapped;
}

export function spinPositionToFrameIndex(spinPosition: number, frameCount: number): number {
  if (frameCount <= 0) {
    return 0;
  }

  return ((Math.round(spinPosition) % frameCount) + frameCount) % frameCount;
}
