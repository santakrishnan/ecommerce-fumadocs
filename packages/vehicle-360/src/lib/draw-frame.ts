import { getImageBounds } from "./image-bounds";

export function computeViewportSize(
  containerWidth: number,
  containerHeight: number,
  aspectRatio: number
): { width: number; height: number } {
  let width = containerWidth;
  let height = width / aspectRatio;

  if (height > containerHeight) {
    height = containerHeight;
    width = height * aspectRatio;
  }

  return { width, height };
}

export function drawFrame(
  context: CanvasRenderingContext2D,
  bitmap: ImageBitmap,
  canvasWidth: number,
  canvasHeight: number,
  cover = false
): void {
  const { offsetX, offsetY, drawWidth, drawHeight } = getImageBounds(
    bitmap.width,
    bitmap.height,
    canvasWidth,
    canvasHeight,
    cover
  );

  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.drawImage(bitmap, offsetX, offsetY, drawWidth, drawHeight);
}

export function resizeCanvasToContainer(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  aspectRatio: number,
  fillContainer = false
): { width: number; height: number } {
  const { width, height } = fillContainer
    ? { width: container.clientWidth, height: container.clientHeight }
    : computeViewportSize(container.clientWidth, container.clientHeight, aspectRatio);

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const context = canvas.getContext("2d");
  if (context) {
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  return { width, height };
}
